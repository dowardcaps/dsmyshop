import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { parseDateInput, toDateInputValue } from "@/lib/dates";
import type { GcashProviderValue, GcashTransactionTypeValue } from "@/lib/gcash/constants";
import type { GcashInput } from "@/lib/validation/gcash";
import type { GcashFilters } from "@/lib/validation/gcash-filters";

export interface GcashRow {
  id: string;
  transactionDate: Date;
  transactionType: GcashTransactionTypeValue;
  provider: GcashProviderValue;
  amount: number;
  charge: number;
  notes: string | null;
}

export interface GcashListResult {
  rows: GcashRow[];
  total: number;
  /** Money moved. Not revenue. */
  totalAmount: number;
  /** Fees earned: the revenue part. */
  totalCharges: number;
  page: number;
  pageCount: number;
}

function buildWhere(userId: string, filters: GcashFilters): Prisma.GcashTransactionWhereInput {
  const { q, from, to, type, provider } = filters;
  return {
    userId,
    ...(from || to
      ? {
          transactionDate: {
            ...(from ? { gte: parseDateInput(from) } : {}),
            ...(to ? { lte: parseDateInput(to) } : {}),
          },
        }
      : {}),
    ...(type ? { transactionType: type } : {}),
    ...(provider ? { provider } : {}),
    ...(q ? { notes: { contains: q, mode: "insensitive" } } : {}),
  };
}

const toRow = (t: Prisma.GcashTransactionGetPayload<object>): GcashRow => ({
  id: t.id,
  transactionDate: t.transactionDate,
  transactionType: t.transactionType,
  provider: t.provider,
  amount: t.amount.toNumber(),
  charge: t.charge.toNumber(),
  notes: t.notes,
});

export async function listGcashTransactions(userId: string, filters: GcashFilters): Promise<GcashListResult> {
  const where = buildWhere(userId, filters);

  const [total, aggregate] = await Promise.all([
    db.gcashTransaction.count({ where }),
    db.gcashTransaction.aggregate({ where, _sum: { amount: true, charge: true } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, pageCount);

  const transactions = await db.gcashTransaction.findMany({
    where,
    orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * filters.pageSize,
    take: filters.pageSize,
  });

  return {
    rows: transactions.map(toRow),
    total,
    totalAmount: aggregate._sum.amount?.toNumber() ?? 0,
    totalCharges: aggregate._sum.charge?.toNumber() ?? 0,
    page,
    pageCount,
  };
}

export async function getGcashTransaction(userId: string, id: string): Promise<GcashRow | null> {
  const transaction = await db.gcashTransaction.findFirst({ where: { id, userId } });
  return transaction ? toRow(transaction) : null;
}

export function gcashToFormValues(row: GcashRow): GcashInput {
  return {
    transactionDate: toDateInputValue(row.transactionDate),
    transactionType: row.transactionType,
    provider: row.provider,
    amount: row.amount,
    charge: row.charge,
    notes: row.notes ?? "",
  };
}
