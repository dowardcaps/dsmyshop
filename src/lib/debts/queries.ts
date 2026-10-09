import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { parseDateInput, toDateInputValue } from "@/lib/dates";
import { centsToAmount } from "@/lib/cents";
import { debtBalanceCents } from "@/lib/debts/calc";
import type { DebtStatusValue } from "@/lib/debts/constants";
import { decimalToCents } from "@/lib/money";
import type { DebtInput } from "@/lib/validation/debt";
import type { DebtFilters } from "@/lib/validation/debt-filters";

export interface DebtRow {
  id: string;
  name: string;
  description: string | null;
  debtDate: Date;
  originalAmount: number;
  totalPaid: number;
  balance: number;
  status: DebtStatusValue;
  paymentCount: number;
}

export interface DebtListResult {
  rows: DebtRow[];
  total: number;
  /** Across all filtered debts, not just this page. */
  totals: { original: number; paid: number; outstanding: number };
  page: number;
  pageCount: number;
}

export interface DebtPaymentRow {
  id: string;
  paymentDate: Date;
  amount: number;
  notes: string | null;
}

export interface DebtDetail extends DebtRow {
  payments: DebtPaymentRow[];
}

const zero = new Prisma.Decimal(0);

function buildWhere(userId: string, filters: DebtFilters): Prisma.DebtWhereInput {
  const { q, from, to, status } = filters;
  return {
    userId,
    ...(status ? { status } : {}),
    ...(from || to
      ? { debtDate: { ...(from ? { gte: parseDateInput(from) } : {}), ...(to ? { lte: parseDateInput(to) } : {}) } }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

function toRow(
  debt: { id: string; name: string; description: string | null; debtDate: Date; originalAmount: Prisma.Decimal; status: DebtStatusValue },
  paid: Prisma.Decimal,
  paymentCount: number,
): DebtRow {
  const originalCents = decimalToCents(debt.originalAmount);
  const paidCents = decimalToCents(paid);
  return {
    id: debt.id,
    name: debt.name,
    description: debt.description,
    debtDate: debt.debtDate,
    originalAmount: centsToAmount(originalCents),
    totalPaid: centsToAmount(paidCents),
    balance: centsToAmount(debtBalanceCents(originalCents, paidCents)),
    status: debt.status,
    paymentCount,
  };
}

export async function listDebts(userId: string, filters: DebtFilters): Promise<DebtListResult> {
  const where = buildWhere(userId, filters);

  const [total, originalAggregate, paidAggregate] = await Promise.all([
    db.debt.count({ where }),
    db.debt.aggregate({ where, _sum: { originalAmount: true } }),
    db.debtPayment.aggregate({ where: { debt: where }, _sum: { amount: true } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, pageCount);

  const debts = await db.debt.findMany({
    where,
    orderBy: [{ debtDate: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * filters.pageSize,
    take: filters.pageSize,
  });

  const payments = await db.debtPayment.groupBy({
    by: ["debtId"],
    where: { debtId: { in: debts.map((d) => d.id) } },
    _sum: { amount: true },
    _count: { _all: true },
  });
  const byDebt = new Map(payments.map((p) => [p.debtId, p]));

  const originalCents = decimalToCents(originalAggregate._sum.originalAmount ?? zero);
  const paidCents = decimalToCents(paidAggregate._sum.amount ?? zero);

  return {
    rows: debts.map((debt) => {
      const group = byDebt.get(debt.id);
      return toRow(debt, group?._sum.amount ?? zero, group?._count._all ?? 0);
    }),
    total,
    totals: {
      original: centsToAmount(originalCents),
      paid: centsToAmount(paidCents),
      outstanding: centsToAmount(debtBalanceCents(originalCents, paidCents)),
    },
    page,
    pageCount,
  };
}

export async function getDebt(userId: string, debtId: string): Promise<DebtDetail | null> {
  const debt = await db.debt.findFirst({
    where: { id: debtId, userId },
    include: { payments: { orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }] } },
  });
  if (!debt) return null;

  const paid = debt.payments.reduce((sum, p) => sum.add(p.amount), zero);
  return {
    ...toRow(debt, paid, debt.payments.length),
    payments: debt.payments.map((p) => ({
      id: p.id,
      paymentDate: p.paymentDate,
      amount: p.amount.toNumber(),
      notes: p.notes,
    })),
  };
}

export function debtToFormValues(debt: DebtRow): DebtInput {
  return {
    name: debt.name,
    description: debt.description ?? "",
    originalAmount: debt.originalAmount,
    debtDate: toDateInputValue(debt.debtDate),
  };
}
