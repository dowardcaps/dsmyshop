import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { ServiceError } from "@/lib/errors";
import { isExemptFromAutoDeduct } from "@/lib/inventory/stock";
import type { InventoryInput, InventoryLinkInput } from "@/lib/validation/inventory";

/** An expected, user-presentable failure (e.g. duplicate name). */
export class InventoryServiceError extends ServiceError {}

const isUniqueViolation = (error: unknown): boolean => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

/**
 * Inventory items used to have one link (a column on the item). Copies any such link into the links table, once,
 * then clears the old column. Safe to call often: it does nothing when there is nothing left to copy.
 */
export async function migrateLegacyLinks(userId: string): Promise<void> {
  const pending = await db.inventoryItem.count({ where: { userId, serviceItemId: { not: null } } });
  if (pending === 0) return;
  await db.$transaction([
    db.$executeRaw`
      INSERT INTO "InventoryLink" ("id", "inventoryItemId", "serviceItemId", "unitsPerSale")
      SELECT 'lnk_' || md5(random()::text || i."id"), i."id", i."serviceItemId", 1
      FROM "InventoryItem" i
      WHERE i."userId" = ${userId} AND i."serviceItemId" IS NOT NULL
        AND EXISTS (SELECT 1 FROM "ServiceItem" s WHERE s."id" = i."serviceItemId")
      ON CONFLICT DO NOTHING`,
    db.$executeRaw`UPDATE "InventoryItem" SET "serviceItemId" = NULL WHERE "userId" = ${userId} AND "serviceItemId" IS NOT NULL`,
  ]);
}

/** Every link must point at a price-list item of this user that is not exempt from automatic subtraction. */
async function validateLinks(userId: string, links: readonly InventoryLinkInput[]): Promise<void> {
  if (links.length === 0) return;
  const services = await db.serviceItem.findMany({
    where: { userId, id: { in: links.map((link) => link.serviceItemId) } },
    select: { id: true, name: true, category: { select: { name: true } } },
  });
  if (services.length !== new Set(links.map((link) => link.serviceItemId)).size) {
    throw new InventoryServiceError("One of the linked price-list items no longer exists.");
  }
  const exempt = services.find((service) => isExemptFromAutoDeduct(service.category.name, service.name));
  if (exempt) {
    throw new InventoryServiceError(
      `${exempt.name} is not subtracted automatically (Printing, Xerox and bond paper). Remove it from the list and adjust the stock by hand.`,
    );
  }
}

/** Names are unique ignoring upper/lower case, so "Ballpen" and "ballpen" cannot both exist. */
async function assertNameFree(userId: string, name: string, exceptId?: string): Promise<void> {
  const clash = await db.inventoryItem.findFirst({
    where: { userId, name: { equals: name, mode: "insensitive" }, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  });
  if (clash) throw new InventoryServiceError("You already have an inventory item with that name.");
}

function translate(error: unknown): never {
  if (isUniqueViolation(error)) {
    // The failing column is named in `meta`, whose shape differs between the Prisma engine and driver adapters.
    const target = JSON.stringify((error as Prisma.PrismaClientKnownRequestError).meta ?? {});
    throw new InventoryServiceError(
      target.includes("serviceItemId")
        ? "One of those price-list items is already used by another inventory item."
        : "You already have an inventory item with that name.",
    );
  }
  throw error;
}

const fields = (input: InventoryInput) => ({
  name: input.name,
  quantity: input.quantity,
  lowLevel: input.lowLevel,
  highLevel: input.highLevel,
  notes: input.notes || null,
});

const linkRows = (links: readonly InventoryLinkInput[]) => links.map((link) => ({ serviceItemId: link.serviceItemId, unitsPerSale: link.unitsPerSale }));

export async function createInventoryItem(userId: string, input: InventoryInput): Promise<string> {
  await validateLinks(userId, input.links);
  await assertNameFree(userId, input.name);
  try {
    const created = await db.inventoryItem.create({
      data: { userId, ...fields(input), links: { create: linkRows(input.links) } },
      select: { id: true },
    });
    return created.id;
  } catch (error) {
    return translate(error);
  }
}

export async function updateInventoryItem(userId: string, id: string, input: InventoryInput): Promise<string> {
  await validateLinks(userId, input.links);
  await assertNameFree(userId, input.name, id);
  try {
    await db.$transaction(async (tx) => {
      // updateMany so the userId check and the write are one statement.
      const { count } = await tx.inventoryItem.updateMany({ where: { id, userId }, data: fields(input) });
      if (count === 0) throw new InventoryServiceError("Item not found.");
      await tx.inventoryLink.deleteMany({ where: { inventoryItemId: id } });
      if (input.links.length > 0) {
        await tx.inventoryLink.createMany({ data: linkRows(input.links).map((link) => ({ ...link, inventoryItemId: id })) });
      }
    });
    return id;
  } catch (error) {
    return translate(error);
  }
}

export async function deleteInventoryItem(userId: string, id: string): Promise<void> {
  const { count } = await db.inventoryItem.deleteMany({ where: { id, userId } });
  if (count === 0) throw new InventoryServiceError("Item not found.");
}

/**
 * Creates an inventory item (stock 0) for every Stationery price-list item that is not linked to any inventory item
 * yet, linked to it so that sales subtract from it. Bond paper is skipped. Returns how many were added.
 */
export async function importStationeryFromPriceList(userId: string): Promise<number> {
  await migrateLegacyLinks(userId);
  const services = await db.serviceItem.findMany({
    where: { userId, category: { name: { equals: "Stationery", mode: "insensitive" } }, inventoryLinks: { none: {} } },
    select: { id: true, name: true, category: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  const wanted = services.filter((service) => !isExemptFromAutoDeduct(service.category.name, service.name));
  if (wanted.length === 0) return 0;

  const taken = new Set((await db.inventoryItem.findMany({ where: { userId }, select: { name: true } })).map((item) => item.name.toLowerCase()));
  let added = 0;
  for (const service of wanted) {
    if (taken.has(service.name.toLowerCase())) continue; // an item with this name exists; link it yourself
    await db.inventoryItem.create({
      data: { userId, name: service.name, quantity: 0, links: { create: { serviceItemId: service.id, unitsPerSale: 1 } } },
    });
    added += 1;
  }
  return added;
}

export interface SoldLine {
  serviceId: string;
  quantity: number;
}

/**
 * After a sale is saved: subtract what was sold from every linked inventory item. Each linked price-list item uses
 * `unitsPerSale` of the stock per one sold; several items feeding the same stock add up. Exempt items (Printing,
 * Xerox, bond paper) are skipped even if a link exists. Stock stops at 0 and never blocks a sale.
 * Returns how many inventory items changed.
 */
export async function deductStockForSale(userId: string, lines: readonly SoldLine[]): Promise<number> {
  if (lines.length === 0) return 0;
  await migrateLegacyLinks(userId);
  const links = await db.inventoryLink.findMany({
    where: { serviceItemId: { in: lines.map((line) => line.serviceId) }, inventoryItem: { userId } },
    select: { inventoryItemId: true, serviceItemId: true, unitsPerSale: true, serviceItem: { select: { name: true, category: { select: { name: true } } } } },
  });
  const sold = new Map<string, number>();
  for (const line of lines) sold.set(line.serviceId, (sold.get(line.serviceId) ?? 0) + line.quantity);

  const used = new Map<string, number>();
  for (const link of links) {
    if (isExemptFromAutoDeduct(link.serviceItem.category.name, link.serviceItem.name)) continue;
    const amount = (sold.get(link.serviceItemId) ?? 0) * link.unitsPerSale;
    if (amount > 0) used.set(link.inventoryItemId, (used.get(link.inventoryItemId) ?? 0) + amount);
  }

  let changed = 0;
  for (const [inventoryItemId, amount] of used) {
    changed += await db.$executeRaw`
      UPDATE "InventoryItem"
      SET "quantity" = GREATEST("quantity" - ${amount}, 0), "updatedAt" = NOW()
      WHERE "id" = ${inventoryItemId} AND "userId" = ${userId}`;
  }
  return changed;
}
