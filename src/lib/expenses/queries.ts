import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { parseDateInput, toDateInputValue } from "@/lib/dates";
import type { ExpenseInput } from "@/lib/validation/expense";
import type { ExpenseFilters } from "@/lib/validation/expense-filters";

export interface ExpenseCategoryOption {
  id: string;
  name: string;
}

export interface ExpenseCategoryRow extends ExpenseCategoryOption {
  description: string | null;
  expenseCount: number;
}

export interface ExpenseRow {
  id: string;
  expenseDate: Date;
  categoryId: string;
  categoryName: string;
  description: string;
  amount: number;
  notes: string | null;
}

export interface ExpenseListResult {
  rows: ExpenseRow[];
  total: number;
  totalAmount: number;
  page: number;
  pageCount: number;
}

export async function listExpenseCategories(userId: string): Promise<ExpenseCategoryOption[]> {
  return db.expenseCategory.findMany({ where: { userId }, orderBy: { name: "asc" }, select: { id: true, name: true } });
}

export async function listExpenseCategoriesWithUsage(userId: string): Promise<ExpenseCategoryRow[]> {
  const categories = await db.expenseCategory.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { _count: { select: { expenses: true } } },
  });
  return categories.map((c) => ({ id: c.id, name: c.name, description: c.description, expenseCount: c._count.expenses }));
}

function buildWhere(userId: string, filters: ExpenseFilters): Prisma.ExpenseWhereInput {
  const { q, from, to, categoryId } = filters;
  return {
    userId,
    ...(from || to
      ? {
          expenseDate: {
            ...(from ? { gte: parseDateInput(from) } : {}),
            ...(to ? { lte: parseDateInput(to) } : {}),
          },
        }
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(q
      ? {
          OR: [
            { description: { contains: q, mode: "insensitive" } },
            { notes: { contains: q, mode: "insensitive" } },
            { category: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

const toRow = (e: Prisma.ExpenseGetPayload<{ include: { category: { select: { name: true } } } }>): ExpenseRow => ({
  id: e.id,
  expenseDate: e.expenseDate,
  categoryId: e.categoryId,
  categoryName: e.category.name,
  description: e.description,
  amount: e.amount.toNumber(),
  notes: e.notes,
});

export async function listExpenses(userId: string, filters: ExpenseFilters): Promise<ExpenseListResult> {
  const where = buildWhere(userId, filters);

  const [total, aggregate] = await Promise.all([
    db.expense.count({ where }),
    db.expense.aggregate({ where, _sum: { amount: true } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, pageCount);

  const expenses = await db.expense.findMany({
    where,
    orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * filters.pageSize,
    take: filters.pageSize,
    include: { category: { select: { name: true } } },
  });

  return { rows: expenses.map(toRow), total, totalAmount: aggregate._sum.amount?.toNumber() ?? 0, page, pageCount };
}

export async function getExpense(userId: string, id: string): Promise<ExpenseRow | null> {
  const expense = await db.expense.findFirst({ where: { id, userId }, include: { category: { select: { name: true } } } });
  return expense ? toRow(expense) : null;
}

export function expenseToFormValues(row: ExpenseRow): ExpenseInput {
  return {
    expenseDate: toDateInputValue(row.expenseDate),
    categoryId: row.categoryId,
    description: row.description,
    amount: row.amount,
    notes: row.notes ?? "",
  };
}
