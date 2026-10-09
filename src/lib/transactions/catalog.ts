import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { ServiceError } from "@/lib/errors";
import { centsToDecimalString, toCents } from "@/lib/cents";
import { applyPriceChange } from "@/lib/transactions/bulk";
import { DEFAULT_SERVICES } from "@/lib/transactions/constants";
import { formatPeso } from "@/lib/format";
import type { BulkEditInput, ServiceInput } from "@/lib/validation/transaction";

export class ServiceCatalogError extends ServiceError {}

export interface ServiceRow {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  categoryName: string;
}

const toPrice = (amount: number) => new Prisma.Decimal(centsToDecimalString(toCents(amount)));

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

/** Inserts the default price list, creating any sale categories it needs. Safe to run twice at once. */
async function seedDefaults(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  const names = [...new Set(DEFAULT_SERVICES.map((service) => service.category))];
  await tx.saleCategory.createMany({ data: names.map((name) => ({ userId, name })), skipDuplicates: true });
  const categories = await tx.saleCategory.findMany({ where: { userId, name: { in: names } }, select: { id: true, name: true } });
  const idByName = new Map(categories.map((category) => [category.name, category.id]));

  await tx.serviceItem.createMany({
    data: DEFAULT_SERVICES.map((service, index) => ({
      userId,
      categoryId: idByName.get(service.category)!,
      name: service.name,
      price: toPrice(service.price),
      sortOrder: index,
    })),
    skipDuplicates: true,
  });
}

/** The first visit to the Transactions page fills the price list. Later visits find it already there. */
export async function ensureServiceCatalog(userId: string): Promise<void> {
  const existing = await db.serviceItem.count({ where: { userId } });
  if (existing > 0) return;
  await db.$transaction((tx) => seedDefaults(tx, userId));
}

export async function listServices(userId: string): Promise<ServiceRow[]> {
  const rows = await db.serviceItem.findMany({
    where: { userId },
    orderBy: [{ category: { name: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, price: true, categoryId: true, category: { select: { name: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    price: row.price.toNumber(),
    categoryId: row.categoryId,
    categoryName: row.category.name,
  }));
}

async function assertCategory(userId: string, categoryId: string): Promise<void> {
  const found = await db.saleCategory.count({ where: { userId, id: categoryId } });
  if (!found) throw new ServiceCatalogError("That category no longer exists.");
}

const NAME_TAKEN = "That category already has a service with this name.";

export async function createService(userId: string, input: ServiceInput): Promise<string> {
  await assertCategory(userId, input.categoryId);
  try {
    const last = await db.serviceItem.aggregate({
      where: { userId, categoryId: input.categoryId },
      _max: { sortOrder: true },
    });
    const created = await db.serviceItem.create({
      data: {
        userId,
        categoryId: input.categoryId,
        name: input.name,
        price: toPrice(input.price),
        sortOrder: (last._max.sortOrder ?? -1) + 1,
      },
      select: { id: true },
    });
    return created.id;
  } catch (error) {
    if (isUniqueViolation(error)) throw new ServiceCatalogError(NAME_TAKEN);
    throw error;
  }
}

export async function updateService(userId: string, serviceId: string, input: ServiceInput): Promise<void> {
  await assertCategory(userId, input.categoryId);
  try {
    const { count } = await db.serviceItem.updateMany({
      where: { id: serviceId, userId },
      data: { categoryId: input.categoryId, name: input.name, price: toPrice(input.price) },
    });
    if (count === 0) throw new ServiceCatalogError("Service not found.");
  } catch (error) {
    if (isUniqueViolation(error)) throw new ServiceCatalogError(NAME_TAKEN);
    throw error;
  }
}

/** Past sales keep their own copy of the name and price, so deleting a service never changes them. */
export async function deleteService(userId: string, serviceId: string): Promise<void> {
  const { count } = await db.serviceItem.deleteMany({ where: { id: serviceId, userId } });
  if (count === 0) throw new ServiceCatalogError("Service not found.");
}

export async function resetServicesToDefault(userId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.serviceItem.deleteMany({ where: { userId } });
    await seedDefaults(tx, userId);
  });
}

/**
 * Changes the price and/or category of many services in one all-or-nothing step: if any single
 * service cannot take the change (a price would drop below ₱0.01, or a name would clash in the new
 * category), nothing is changed. Returns how many services were updated.
 */
export async function bulkEditServices(userId: string, input: BulkEditInput): Promise<number> {
  const ids = [...new Set(input.ids)];
  if (input.categoryId) await assertCategory(userId, input.categoryId);

  try {
    return await db.$transaction(async (tx) => {
      const services = await tx.serviceItem.findMany({
        where: { userId, id: { in: ids } },
        select: { id: true, name: true, price: true },
      });
      if (services.length !== ids.length) {
        throw new ServiceCatalogError("Some selected services no longer exist. Refresh the page and try again.");
      }

      const updates = services.map((service) => {
        let price: Prisma.Decimal | undefined;
        if (input.priceChange) {
          const cents = applyPriceChange(toCents(service.price.toNumber()), input.priceChange);
          if (cents === null) {
            throw new ServiceCatalogError(
              `"${service.name}" (${formatPeso(service.price.toNumber())}) would end up below ₱0.01 or too large. Nothing was changed.`,
            );
          }
          price = new Prisma.Decimal(centsToDecimalString(cents));
        }
        return { id: service.id, price };
      });

      for (const update of updates) {
        await tx.serviceItem.update({
          where: { id: update.id },
          data: { ...(update.price ? { price: update.price } : {}), ...(input.categoryId ? { categoryId: input.categoryId } : {}) },
        });
      }
      return updates.length;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ServiceCatalogError("Another service in that category already has the same name as one you selected. Nothing was changed.");
    }
    throw error;
  }
}

export async function bulkDeleteServices(userId: string, ids: string[]): Promise<number> {
  const { count } = await db.serviceItem.deleteMany({ where: { userId, id: { in: [...new Set(ids)] } } });
  if (count === 0) throw new ServiceCatalogError("Those services no longer exist.");
  return count;
}
