import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { ServiceError } from "@/lib/errors";
import { isExemptFromAutoDeduct } from "@/lib/inventory/stock";
import type { InventoryInput } from "@/lib/validation/inventory";

/** An expected, user-presentable failure (e.g. duplicate name). */
export class InventoryServiceError extends ServiceError {}

const isUniqueViolation = (error: unknown): boolean => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

/** A link is only allowed to a price-list item of this user that is not exempt from automatic subtraction. */
async function resolveLink(userId: string, serviceItemId: string): Promise<string | null> {
  if (!serviceItemId) return null;
  const service = await db.serviceItem.findFirst({
    where: { id: serviceItemId, userId },
    select: { name: true, category: { select: { name: true } } },
  });
  if (!service) throw new InventoryServiceError("That price-list item no longer exists.");
  if (isExemptFromAutoDeduct(service.category.name, service.name)) {
    throw new InventoryServiceError("Printing, Xerox and bond paper are not subtracted automatically. Leave the link empty and adjust the stock by hand.");
  }
  return serviceItemId;
}

async function toData(userId: string, input: InventoryInput) {
  return {
    name: input.name,
    quantity: input.quantity,
    lowLevel: input.lowLevel,
    highLevel: input.highLevel,
    notes: input.notes || null,
    serviceItemId: await resolveLink(userId, input.serviceItemId),
  };
}

function translate(error: unknown): never {
  if (isUniqueViolation(error)) {
    // The failing column is named in `meta`, whose shape differs between the Prisma engine and driver adapters.
    const target = JSON.stringify((error as Prisma.PrismaClientKnownRequestError).meta ?? {});
    throw new InventoryServiceError(
      target.includes("serviceItemId") ? "That price-list item is already linked to another inventory item." : "You already have an inventory item with that name.",
    );
  }
  throw error;
}

/** Names are unique ignoring upper/lower case, so "Ballpen" and "ballpen" cannot both exist. */
async function assertNameFree(userId: string, name: string, exceptId?: string): Promise<void> {
  const clash = await db.inventoryItem.findFirst({
    where: { userId, name: { equals: name, mode: "insensitive" }, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  });
  if (clash) throw new InventoryServiceError("You already have an inventory item with that name.");
}

export async function createInventoryItem(userId: string, input: InventoryInput): Promise<string> {
  const data = await toData(userId, input);
  await assertNameFree(userId, data.name);
  try {
    return (await db.inventoryItem.create({ data: { userId, ...data }, select: { id: true } })).id;
  } catch (error) {
    return translate(error);
  }
}

export async function updateInventoryItem(userId: string, id: string, input: InventoryInput): Promise<string> {
  const data = await toData(userId, input);
  await assertNameFree(userId, data.name, id);
  try {
    const { count } = await db.inventoryItem.updateMany({ where: { id, userId }, data });
    if (count === 0) throw new InventoryServiceError("Item not found.");
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
 * Creates an inventory item (stock 0) for every Stationery price-list item that does not have one yet, linked
 * to it so that sales subtract from it. Bond paper is skipped. Returns how many were added.
 */
export async function importStationeryFromPriceList(userId: string): Promise<number> {
  const services = await db.serviceItem.findMany({
    where: { userId, category: { name: { equals: "Stationery", mode: "insensitive" } }, inventoryItems: { none: {} } },
    select: { id: true, name: true, category: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  const wanted = services.filter((service) => !isExemptFromAutoDeduct(service.category.name, service.name));
  if (wanted.length === 0) return 0;
  const { count } = await db.inventoryItem.createMany({
    data: wanted.map((service) => ({ userId, name: service.name, quantity: 0, serviceItemId: service.id })),
    skipDuplicates: true,
  });
  return count;
}

export interface SoldLine {
  serviceId: string;
  quantity: number;
}

/**
 * After a sale is saved: subtract what was sold from every linked inventory item. Exempt items (Printing, Xerox,
 * bond paper) are skipped even if they were linked. Stock stops at 0 and never blocks a sale.
 * Returns how many inventory items changed.
 */
export async function deductStockForSale(userId: string, lines: readonly SoldLine[]): Promise<number> {
  if (lines.length === 0) return 0;
  const services = await db.serviceItem.findMany({
    where: { userId, id: { in: lines.map((line) => line.serviceId) }, inventoryItems: { some: {} } },
    select: { id: true, name: true, category: { select: { name: true } } },
  });
  const sold = new Map(lines.map((line) => [line.serviceId, line.quantity]));
  let changed = 0;
  for (const service of services) {
    if (isExemptFromAutoDeduct(service.category.name, service.name)) continue;
    const quantity = sold.get(service.id) ?? 0;
    if (quantity <= 0) continue;
    changed += await db.$executeRaw`
      UPDATE "InventoryItem"
      SET "quantity" = GREATEST("quantity" - ${quantity}, 0), "updatedAt" = NOW()
      WHERE "userId" = ${userId} AND "serviceItemId" = ${service.id}`;
  }
  return changed;
}
