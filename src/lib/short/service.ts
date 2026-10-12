import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { parseDateInput } from "@/lib/dates";
import { ServiceError } from "@/lib/errors";
import type { ShortInput } from "@/lib/validation/short";

/** An expected, user-presentable failure (e.g. record not found). */
export class ShortServiceError extends ServiceError {}

function toData(input: ShortInput) {
  return {
    shortDate: parseDateInput(input.shortDate),
    amount: new Prisma.Decimal(input.amount.toFixed(2)),
    notes: input.notes || null,
  };
}

export async function createShort(userId: string, input: ShortInput): Promise<string> {
  const created = await db.cashShort.create({ data: { userId, ...toData(input) }, select: { id: true } });
  return created.id;
}

export async function updateShort(userId: string, id: string, input: ShortInput): Promise<string> {
  // updateMany so the userId check and the write are one atomic statement.
  const { count } = await db.cashShort.updateMany({ where: { id, userId }, data: toData(input) });
  if (count === 0) throw new ShortServiceError("Record not found.");
  return id;
}

export async function deleteShort(userId: string, id: string): Promise<void> {
  const { count } = await db.cashShort.deleteMany({ where: { id, userId } });
  if (count === 0) throw new ShortServiceError("Record not found.");
}
