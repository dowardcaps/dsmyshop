import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { ServiceError } from "@/lib/errors";
import { parseDateInput } from "@/lib/dates";
import { centsToDecimalString, lineSubtotalCents, saleTotalCents } from "@/lib/sales/calc";
import type { SaleInput } from "@/lib/validation/sale";

/** An expected, user-presentable failure (not found, bad category, ...). */
export class SaleServiceError extends ServiceError {}

type Tx = Prisma.TransactionClient;

const MAX_NUMBER_RETRIES = 5;

async function assertCategoriesBelongToUser(tx: Tx, userId: string, items: SaleInput["items"]) {
  const ids = [...new Set(items.map((item) => item.categoryId))];
  const count = await tx.saleCategory.count({ where: { userId, id: { in: ids } } });
  if (count !== ids.length) throw new SaleServiceError("One of the selected categories no longer exists.");
}

/**
 * S-YYYYMMDD-0001, incrementing per day.
 * A transaction-scoped advisory lock makes concurrent saves for the same day queue up
 * instead of picking the same number. The unique index and the caller's retry remain as a safety net.
 */
async function nextTransactionNumber(tx: Tx, userId: string, transactionDate: string): Promise<string> {
  const prefix = `S-${transactionDate.replaceAll("-", "")}-`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`sale-number:${userId}:${transactionDate}`}))`;
  const last = await tx.sale.findFirst({
    where: { userId, transactionNumber: { startsWith: prefix } },
    orderBy: { transactionNumber: "desc" },
    select: { transactionNumber: true },
  });
  const next = last ? Number.parseInt(last.transactionNumber.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

function buildItems(items: SaleInput["items"]) {
  return items.map((item) => ({
    categoryId: item.categoryId,
    description: item.description,
    quantity: item.quantity,
    unitPrice: new Prisma.Decimal(centsToDecimalString(Math.round(item.unitPrice * 100))),
    // Recalculated here; any subtotal the client might send is ignored.
    subtotal: new Prisma.Decimal(centsToDecimalString(lineSubtotalCents(item))),
  }));
}

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

export async function createSale(userId: string, input: SaleInput): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        await assertCategoriesBelongToUser(tx, userId, input.items);
        const sale = await tx.sale.create({
          data: {
            userId,
            transactionNumber: await nextTransactionNumber(tx, userId, input.transactionDate),
            transactionDate: parseDateInput(input.transactionDate),
            customerName: input.customerName || null,
            paymentMethod: input.paymentMethod,
            notes: input.notes || null,
            totalAmount: new Prisma.Decimal(centsToDecimalString(saleTotalCents(input.items))),
            items: { create: buildItems(input.items) },
          },
          select: { id: true },
        });
        return sale.id;
      });
    } catch (error) {
      // Two sales created at the same moment can pick the same number: try again.
      if (isUniqueViolation(error) && attempt < MAX_NUMBER_RETRIES) continue;
      throw error;
    }
  }
}

export async function updateSale(userId: string, saleId: string, input: SaleInput): Promise<string> {
  return db.$transaction(async (tx) => {
    const existing = await tx.sale.findFirst({ where: { id: saleId, userId }, select: { id: true } });
    if (!existing) throw new SaleServiceError("Sale not found.");
    await assertCategoriesBelongToUser(tx, userId, input.items);

    await tx.saleItem.deleteMany({ where: { saleId } });
    await tx.sale.update({
      where: { id: saleId },
      data: {
        transactionDate: parseDateInput(input.transactionDate),
        customerName: input.customerName || null,
        paymentMethod: input.paymentMethod,
        notes: input.notes || null,
        totalAmount: new Prisma.Decimal(centsToDecimalString(saleTotalCents(input.items))),
        items: { create: buildItems(input.items) },
      },
    });
    return saleId;
  });
}

export async function deleteSale(userId: string, saleId: string): Promise<void> {
  const { count } = await db.sale.deleteMany({ where: { id: saleId, userId } });
  if (count === 0) throw new SaleServiceError("Sale not found.");
}
