import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { parseDateInput } from "@/lib/dates";
import { ServiceError } from "@/lib/errors";
import type { ExpenseInput } from "@/lib/validation/expense";

export class ExpenseServiceError extends ServiceError {}

async function assertCategoryBelongsToUser(userId: string, categoryId: string) {
  const count = await db.expenseCategory.count({ where: { id: categoryId, userId } });
  if (count === 0) throw new ExpenseServiceError("The selected category no longer exists.");
}

function toData(input: ExpenseInput) {
  return {
    categoryId: input.categoryId,
    expenseDate: parseDateInput(input.expenseDate),
    description: input.description,
    amount: new Prisma.Decimal(input.amount.toFixed(2)),
    notes: input.notes || null,
  };
}

export async function createExpense(userId: string, input: ExpenseInput): Promise<string> {
  await assertCategoryBelongsToUser(userId, input.categoryId);
  const created = await db.expense.create({ data: { userId, ...toData(input) }, select: { id: true } });
  return created.id;
}

export async function updateExpense(userId: string, id: string, input: ExpenseInput): Promise<string> {
  await assertCategoryBelongsToUser(userId, input.categoryId);
  // updateMany so the owner check and the write are one atomic statement.
  const { count } = await db.expense.updateMany({ where: { id, userId }, data: toData(input) });
  if (count === 0) throw new ExpenseServiceError("Expense not found.");
  return id;
}

export async function deleteExpense(userId: string, id: string): Promise<void> {
  const { count } = await db.expense.deleteMany({ where: { id, userId } });
  if (count === 0) throw new ExpenseServiceError("Expense not found.");
}
