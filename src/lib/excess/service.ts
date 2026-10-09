import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { parseDateInput } from "@/lib/dates";
import { ServiceError } from "@/lib/errors";
import type { ExcessInput } from "@/lib/validation/excess";

/** An expected, user-presentable failure (e.g. record not found). */
export class ExcessServiceError extends ServiceError {}

function toData(input: ExcessInput) {
  return {
    excessDate: parseDateInput(input.excessDate),
    amount: new Prisma.Decimal(input.amount.toFixed(2)),
    notes: input.notes || null,
  };
}

export async function createExcess(userId: string, input: ExcessInput): Promise<string> {
  const created = await db.excessMoney.create({ data: { userId, ...toData(input) }, select: { id: true } });
  return created.id;
}

export async function updateExcess(userId: string, id: string, input: ExcessInput): Promise<string> {
  // updateMany so the userId check and the write are one atomic statement.
  const { count } = await db.excessMoney.updateMany({ where: { id, userId }, data: toData(input) });
  if (count === 0) throw new ExcessServiceError("Record not found.");
  return id;
}

export async function deleteExcess(userId: string, id: string): Promise<void> {
  const { count } = await db.excessMoney.deleteMany({ where: { id, userId } });
  if (count === 0) throw new ExcessServiceError("Record not found.");
}
