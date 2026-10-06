import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { ServiceError } from "@/lib/errors";
import { parseDateInput } from "@/lib/dates";
import type { GcashInput } from "@/lib/validation/gcash";

/** An expected, user-presentable failure (e.g. record not found). */
export class GcashServiceError extends ServiceError {}

const money = (value: number) => new Prisma.Decimal(value.toFixed(2));

function toData(input: GcashInput) {
  return {
    transactionDate: parseDateInput(input.transactionDate),
    transactionType: input.transactionType,
    provider: input.provider,
    amount: money(input.amount),
    charge: money(input.charge),
    notes: input.notes || null,
  };
}

export async function createGcashTransaction(userId: string, input: GcashInput): Promise<string> {
  const created = await db.gcashTransaction.create({ data: { userId, ...toData(input) }, select: { id: true } });
  return created.id;
}

export async function updateGcashTransaction(userId: string, id: string, input: GcashInput): Promise<string> {
  // updateMany so the userId check and the write are one atomic statement.
  const { count } = await db.gcashTransaction.updateMany({ where: { id, userId }, data: toData(input) });
  if (count === 0) throw new GcashServiceError("Transaction not found.");
  return id;
}

export async function deleteGcashTransaction(userId: string, id: string): Promise<void> {
  const { count } = await db.gcashTransaction.deleteMany({ where: { id, userId } });
  if (count === 0) throw new GcashServiceError("Transaction not found.");
}
