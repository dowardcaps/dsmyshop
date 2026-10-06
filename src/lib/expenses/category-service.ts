import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { ExpenseServiceError } from "@/lib/expenses/service";
import type { ExpenseCategoryInput } from "@/lib/validation/expense";

const NAME_TAKEN = "A category with that name already exists.";

const isPrismaError = (error: unknown, code: string): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;

async function assertNameAvailable(userId: string, name: string, exceptId?: string) {
  const clash = await db.expenseCategory.findFirst({
    where: { userId, name: { equals: name, mode: "insensitive" }, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  });
  if (clash) throw new ExpenseServiceError(NAME_TAKEN);
}

export async function createExpenseCategory(userId: string, input: ExpenseCategoryInput): Promise<string> {
  await assertNameAvailable(userId, input.name);
  try {
    const created = await db.expenseCategory.create({
      data: { userId, name: input.name, description: input.description || null },
      select: { id: true },
    });
    return created.id;
  } catch (error) {
    if (isPrismaError(error, "P2002")) throw new ExpenseServiceError(NAME_TAKEN);
    throw error;
  }
}

export async function updateExpenseCategory(userId: string, id: string, input: ExpenseCategoryInput): Promise<string> {
  await assertNameAvailable(userId, input.name, id);
  try {
    const { count } = await db.expenseCategory.updateMany({
      where: { id, userId },
      data: { name: input.name, description: input.description || null },
    });
    if (count === 0) throw new ExpenseServiceError("Category not found.");
    return id;
  } catch (error) {
    if (isPrismaError(error, "P2002")) throw new ExpenseServiceError(NAME_TAKEN);
    throw error;
  }
}

/** Only categories with no expenses can be deleted. The database foreign key backs this up. */
export async function deleteExpenseCategory(userId: string, id: string): Promise<void> {
  const category = await db.expenseCategory.findFirst({
    where: { id, userId },
    select: { _count: { select: { expenses: true } } },
  });
  if (!category) throw new ExpenseServiceError("Category not found.");

  const inUse = category._count.expenses;
  const inUseMessage = (n: number) =>
    `This category is used by ${n === 1 ? "1 expense" : `${n} expenses`} and cannot be deleted. Reassign or delete those expenses first.`;
  if (inUse > 0) throw new ExpenseServiceError(inUseMessage(inUse));

  try {
    await db.expenseCategory.deleteMany({ where: { id, userId } });
  } catch (error) {
    // An expense was added to the category between the check and the delete.
    if (isPrismaError(error, "P2003")) throw new ExpenseServiceError(inUseMessage(1));
    throw error;
  }
}
