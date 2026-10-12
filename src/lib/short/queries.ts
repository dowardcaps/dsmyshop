import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { parseDateInput, toDateInputValue } from "@/lib/dates";
import type { ShortInput } from "@/lib/validation/short";
import type { ShortFilters } from "@/lib/validation/short-filters";

export interface ShortRow {
  id: string;
  shortDate: Date;
  amount: number;
  notes: string | null;
}

export interface ShortListResult {
  rows: ShortRow[];
  total: number;
  totalAmount: number;
  page: number;
  pageCount: number;
}

function buildWhere(userId: string, filters: ShortFilters): Prisma.CashShortWhereInput {
  const { q, from, to } = filters;
  return {
    userId,
    ...(from || to
      ? { shortDate: { ...(from ? { gte: parseDateInput(from) } : {}), ...(to ? { lte: parseDateInput(to) } : {}) } }
      : {}),
    ...(q ? { notes: { contains: q, mode: "insensitive" } } : {}),
  };
}

const toRow = (e: Prisma.CashShortGetPayload<object>): ShortRow => ({
  id: e.id,
  shortDate: e.shortDate,
  amount: e.amount.toNumber(),
  notes: e.notes,
});

export async function listShort(userId: string, filters: ShortFilters): Promise<ShortListResult> {
  const where = buildWhere(userId, filters);
  const [total, aggregate] = await Promise.all([
    db.cashShort.count({ where }),
    db.cashShort.aggregate({ where, _sum: { amount: true } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, pageCount);

  const rows = await db.cashShort.findMany({
    where,
    orderBy: [{ shortDate: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * filters.pageSize,
    take: filters.pageSize,
  });

  return { rows: rows.map(toRow), total, totalAmount: aggregate._sum.amount?.toNumber() ?? 0, page, pageCount };
}

export async function getShort(userId: string, id: string): Promise<ShortRow | null> {
  const record = await db.cashShort.findFirst({ where: { id, userId } });
  return record ? toRow(record) : null;
}

export function shortToFormValues(row: ShortRow): ShortInput {
  return { shortDate: toDateInputValue(row.shortDate), amount: row.amount, notes: row.notes ?? "" };
}
