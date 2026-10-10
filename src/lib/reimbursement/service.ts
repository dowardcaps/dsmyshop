import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { parseDateInput } from "@/lib/dates";
import { ServiceError } from "@/lib/errors";
import type { ReimbursementInput } from "@/lib/validation/reimbursement";

/** An expected, user-presentable failure (e.g. record not found). */
export class ReimbursementServiceError extends ServiceError {}

function toData(input: ReimbursementInput) {
  return {
    reimbursementDate: parseDateInput(input.reimbursementDate),
    description: input.description,
    amount: new Prisma.Decimal(input.amount.toFixed(2)),
    notes: input.notes || null,
  };
}

export async function createReimbursement(userId: string, input: ReimbursementInput): Promise<string> {
  const created = await db.reimbursement.create({ data: { userId, ...toData(input) }, select: { id: true } });
  return created.id;
}

export async function updateReimbursement(userId: string, id: string, input: ReimbursementInput): Promise<string> {
  // updateMany so the userId check and the write are one atomic statement.
  const { count } = await db.reimbursement.updateMany({ where: { id, userId }, data: toData(input) });
  if (count === 0) throw new ReimbursementServiceError("Record not found.");
  return id;
}

export async function deleteReimbursement(userId: string, id: string): Promise<void> {
  const { count } = await db.reimbursement.deleteMany({ where: { id, userId } });
  if (count === 0) throw new ReimbursementServiceError("Record not found.");
}
