import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { parseDateInput, toDateInputValue } from "@/lib/dates";
import type { ReimbursementInput } from "@/lib/validation/reimbursement";
import type { ReimbursementFilters } from "@/lib/validation/reimbursement-filters";

export interface ReimbursementRow {
  id: string;
  reimbursementDate: Date;
  description: string;
  amount: number;
  notes: string | null;
}

export interface ReimbursementListResult {
  rows: ReimbursementRow[];
  total: number;
  totalAmount: number;
  page: number;
  pageCount: number;
}

function buildWhere(userId: string, filters: ReimbursementFilters): Prisma.ReimbursementWhereInput {
  const { q, from, to } = filters;
  return {
    userId,
    ...(from || to
      ? { reimbursementDate: { ...(from ? { gte: parseDateInput(from) } : {}), ...(to ? { lte: parseDateInput(to) } : {}) } }
      : {}),
    ...(q ? { OR: [{ description: { contains: q, mode: "insensitive" } }, { notes: { contains: q, mode: "insensitive" } }] } : {}),
  };
}

const toRow = (e: Prisma.ReimbursementGetPayload<object>): ReimbursementRow => ({
  id: e.id,
  reimbursementDate: e.reimbursementDate,
  description: e.description,
  amount: e.amount.toNumber(),
  notes: e.notes,
});

export async function listReimbursement(userId: string, filters: ReimbursementFilters): Promise<ReimbursementListResult> {
  const where = buildWhere(userId, filters);
  const [total, aggregate] = await Promise.all([
    db.reimbursement.count({ where }),
    db.reimbursement.aggregate({ where, _sum: { amount: true } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, pageCount);

  const rows = await db.reimbursement.findMany({
    where,
    orderBy: [{ reimbursementDate: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * filters.pageSize,
    take: filters.pageSize,
  });

  return { rows: rows.map(toRow), total, totalAmount: aggregate._sum.amount?.toNumber() ?? 0, page, pageCount };
}

export async function getReimbursement(userId: string, id: string): Promise<ReimbursementRow | null> {
  const record = await db.reimbursement.findFirst({ where: { id, userId } });
  return record ? toRow(record) : null;
}

export function reimbursementToFormValues(row: ReimbursementRow): ReimbursementInput {
  return { reimbursementDate: toDateInputValue(row.reimbursementDate), description: row.description, amount: row.amount, notes: row.notes ?? "" };
}
