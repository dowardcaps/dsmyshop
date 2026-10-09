import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { parseDateInput, toDateInputValue } from "@/lib/dates";
import type { ExcessInput } from "@/lib/validation/excess";
import type { ExcessFilters } from "@/lib/validation/excess-filters";

export interface ExcessRow {
  id: string;
  excessDate: Date;
  amount: number;
  notes: string | null;
}

export interface ExcessListResult {
  rows: ExcessRow[];
  total: number;
  totalAmount: number;
  page: number;
  pageCount: number;
}

function buildWhere(userId: string, filters: ExcessFilters): Prisma.ExcessMoneyWhereInput {
  const { q, from, to } = filters;
  return {
    userId,
    ...(from || to
      ? { excessDate: { ...(from ? { gte: parseDateInput(from) } : {}), ...(to ? { lte: parseDateInput(to) } : {}) } }
      : {}),
    ...(q ? { notes: { contains: q, mode: "insensitive" } } : {}),
  };
}

const toRow = (e: Prisma.ExcessMoneyGetPayload<object>): ExcessRow => ({
  id: e.id,
  excessDate: e.excessDate,
  amount: e.amount.toNumber(),
  notes: e.notes,
});

export async function listExcess(userId: string, filters: ExcessFilters): Promise<ExcessListResult> {
  const where = buildWhere(userId, filters);
  const [total, aggregate] = await Promise.all([
    db.excessMoney.count({ where }),
    db.excessMoney.aggregate({ where, _sum: { amount: true } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, pageCount);

  const rows = await db.excessMoney.findMany({
    where,
    orderBy: [{ excessDate: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * filters.pageSize,
    take: filters.pageSize,
  });

  return { rows: rows.map(toRow), total, totalAmount: aggregate._sum.amount?.toNumber() ?? 0, page, pageCount };
}

export async function getExcess(userId: string, id: string): Promise<ExcessRow | null> {
  const record = await db.excessMoney.findFirst({ where: { id, userId } });
  return record ? toRow(record) : null;
}

export function excessToFormValues(row: ExcessRow): ExcessInput {
  return { excessDate: toDateInputValue(row.excessDate), amount: row.amount, notes: row.notes ?? "" };
}
