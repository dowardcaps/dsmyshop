import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { parseDateInput } from "@/lib/dates";
import { decimalToCents } from "@/lib/money";
import { TABLE_PAGE_SIZE } from "@/lib/pagination";
import {
  buildMonthlySeries,
  netIncomeCents,
  revenueCents,
  topCategories,
  type CategorySlice,
  type MonthlyPoint,
} from "@/lib/dashboard/calc";
import { periodRange, type DashboardPeriod } from "@/lib/dashboard/period";

export type RecentKind = "SALE" | "EXPENSE" | "GCASH";

export interface RecentTransaction {
  key: string;
  kind: RecentKind;
  date: Date;
  title: string;
  detail: string;
  /** Sale total, expense amount, or GCash amount moved (cash movement, not revenue). */
  amountCents: number;
  /** GCash fee earned (revenue). Only for GCASH rows. */
  chargeCents: number | null;
  href: string;
}

export interface DashboardData {
  period: DashboardPeriod;
  summary: {
    salesCents: number;
    expensesCents: number;
    gcashChargesCents: number;
    /** Cash overage in the period. Added to net income, not part of revenue. */
    excessCents: number;
    revenueCents: number;
    netIncomeCents: number;
    /** Outstanding on ALL debts as of today (not limited to the period). */
    outstandingDebtCents: number;
    openDebtCount: number;
  };
  /** Shown separately: not part of revenue or net income. */
  cashMovements: { cashInCents: number; cashOutCents: number; loadCents: number; count: number };
  adjustments: { totalCents: number; count: number };
  monthly: MonthlyPoint[];
  salesByCategory: CategorySlice[];
  recent: RecentTransaction[];
  counts: { sales: number; expenses: number; gcash: number; excess: number };
  /** True when the account has no sales, expenses, GCash or debt records at all. */
  isEmpty: boolean;
  earliestYear: number | null;
}

const RECENT_LIMIT = TABLE_PAGE_SIZE;

const cents = (value: Prisma.Decimal | null | undefined) => (value ? decimalToCents(value) : 0);

/** month (1..12) -> centavos from a raw "month, total" result. */
function toMonthMap(rows: { month: number; total: Prisma.Decimal | null }[]): Map<number, number> {
  return new Map(rows.map((row) => [Number(row.month), cents(row.total)]));
}

export async function getDashboardData(userId: string, period: DashboardPeriod): Promise<DashboardData> {
  const { from, to } = periodRange(period);
  const fromDate = parseDateInput(from);
  const toDate = parseDateInput(to);
  const yearStart = `${period.year}-01-01`;
  const yearEnd = `${period.year}-12-31`;
  const inPeriod = { gte: fromDate, lte: toDate };

  const [
    salesAgg,
    expensesAgg,
    excessAgg,
    gcashByType,
    adjustmentsAgg,
    debtOriginal,
    debtPaid,
    openDebtCount,
    totalCounts,
    monthlySales,
    monthlyCharges,
    monthlyExpenses,
    monthlyExcess,
    categoryRows,
    recentSales,
    recentExpenses,
    recentGcash,
    earliest,
  ] = await Promise.all([
    db.sale.aggregate({
      where: { userId, transactionDate: inPeriod },
      _sum: { totalAmount: true },
      _count: true,
    }),
    db.expense.aggregate({
      where: { userId, expenseDate: inPeriod },
      _sum: { amount: true },
      _count: true,
    }),
    db.excessMoney.aggregate({
      where: { userId, excessDate: inPeriod },
      _sum: { amount: true },
      _count: true,
    }),
    db.gcashTransaction.groupBy({
      by: ["transactionType"],
      where: { userId, transactionDate: inPeriod },
      _sum: { amount: true, charge: true },
      _count: true,
    }),
    db.monthlyAdjustment.aggregate({
      where: { userId, adjustmentDate: inPeriod },
      _sum: { amount: true },
      _count: true,
    }),
    db.debt.aggregate({ where: { userId }, _sum: { originalAmount: true } }),
    db.debtPayment.aggregate({ where: { debt: { userId } }, _sum: { amount: true } }),
    db.debt.count({ where: { userId, status: { not: "PAID" } } }),
    Promise.all([
      db.sale.count({ where: { userId } }),
      db.expense.count({ where: { userId } }),
      db.gcashTransaction.count({ where: { userId } }),
      db.debt.count({ where: { userId } }),
      db.excessMoney.count({ where: { userId } }),
    ]),
    db.$queryRaw<{ month: number; total: Prisma.Decimal | null }[]>`
      SELECT EXTRACT(MONTH FROM "transactionDate")::int AS month, SUM("totalAmount") AS total
      FROM "Sale"
      WHERE "userId" = ${userId} AND "transactionDate" BETWEEN ${yearStart}::date AND ${yearEnd}::date
      GROUP BY 1`,
    db.$queryRaw<{ month: number; total: Prisma.Decimal | null }[]>`
      SELECT EXTRACT(MONTH FROM "transactionDate")::int AS month, SUM("charge") AS total
      FROM "GcashTransaction"
      WHERE "userId" = ${userId} AND "transactionDate" BETWEEN ${yearStart}::date AND ${yearEnd}::date
      GROUP BY 1`,
    db.$queryRaw<{ month: number; total: Prisma.Decimal | null }[]>`
      SELECT EXTRACT(MONTH FROM "expenseDate")::int AS month, SUM("amount") AS total
      FROM "Expense"
      WHERE "userId" = ${userId} AND "expenseDate" BETWEEN ${yearStart}::date AND ${yearEnd}::date
      GROUP BY 1`,
    db.$queryRaw<{ month: number; total: Prisma.Decimal | null }[]>`
      SELECT EXTRACT(MONTH FROM "excessDate")::int AS month, SUM("amount") AS total
      FROM "ExcessMoney"
      WHERE "userId" = ${userId} AND "excessDate" BETWEEN ${yearStart}::date AND ${yearEnd}::date
      GROUP BY 1`,
    db.$queryRaw<{ name: string; total: Prisma.Decimal | null }[]>`
      SELECT c."name" AS name, SUM(i."subtotal") AS total
      FROM "SaleItem" i
      JOIN "Sale" s ON s."id" = i."saleId"
      JOIN "SaleCategory" c ON c."id" = i."categoryId"
      WHERE s."userId" = ${userId} AND s."transactionDate" BETWEEN ${from}::date AND ${to}::date
      GROUP BY c."name"`,
    db.sale.findMany({
      where: { userId, transactionDate: inPeriod },
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      take: RECENT_LIMIT,
      select: {
        id: true,
        transactionNumber: true,
        transactionDate: true,
        customerName: true,
        totalAmount: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    db.expense.findMany({
      where: { userId, expenseDate: inPeriod },
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
      take: RECENT_LIMIT,
      select: {
        id: true,
        expenseDate: true,
        description: true,
        amount: true,
        createdAt: true,
        category: { select: { name: true } },
      },
    }),
    db.gcashTransaction.findMany({
      where: { userId, transactionDate: inPeriod },
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      take: RECENT_LIMIT,
      select: {
        id: true,
        transactionDate: true,
        transactionType: true,
        provider: true,
        amount: true,
        charge: true,
        createdAt: true,
      },
    }),
    db.$queryRaw<{ year: number | null }[]>`
      SELECT MIN(y)::int AS year FROM (
        SELECT EXTRACT(YEAR FROM MIN("transactionDate")) AS y FROM "Sale" WHERE "userId" = ${userId}
        UNION ALL SELECT EXTRACT(YEAR FROM MIN("expenseDate")) FROM "Expense" WHERE "userId" = ${userId}
        UNION ALL SELECT EXTRACT(YEAR FROM MIN("transactionDate")) FROM "GcashTransaction" WHERE "userId" = ${userId}
        UNION ALL SELECT EXTRACT(YEAR FROM MIN("excessDate")) FROM "ExcessMoney" WHERE "userId" = ${userId}
      ) t`,
  ]);

  // ── summary ──
  const salesCents = cents(salesAgg._sum.totalAmount);
  const expensesCents = cents(expensesAgg._sum.amount);
  const excessCents = cents(excessAgg._sum.amount);
  const gcashChargesCents = gcashByType.reduce((sum, row) => sum + cents(row._sum.charge), 0);
  const outstandingDebtCents = cents(debtOriginal._sum.originalAmount) - cents(debtPaid._sum.amount);

  const movement = (type: string) => cents(gcashByType.find((row) => row.transactionType === type)?._sum.amount);

  // ── recent transactions (period, newest first) ──
  const recent: (RecentTransaction & { created: number })[] = [
    ...recentSales.map((sale) => ({
      key: `sale-${sale.id}`,
      kind: "SALE" as const,
      date: sale.transactionDate,
      title: sale.transactionNumber,
      detail: `${sale.customerName?.trim() || "Walk-in"} · ${sale._count.items} item${sale._count.items === 1 ? "" : "s"}`,
      amountCents: cents(sale.totalAmount),
      chargeCents: null,
      href: `/sales/${sale.id}`,
      created: sale.createdAt.getTime(),
    })),
    ...recentExpenses.map((expense) => ({
      key: `expense-${expense.id}`,
      kind: "EXPENSE" as const,
      date: expense.expenseDate,
      title: expense.description,
      detail: expense.category.name,
      amountCents: cents(expense.amount),
      chargeCents: null,
      href: `/records?tab=expenses&edit=${expense.id}`,
      created: expense.createdAt.getTime(),
    })),
    ...recentGcash.map((tx) => ({
      key: `gcash-${tx.id}`,
      kind: "GCASH" as const,
      date: tx.transactionDate,
      title: tx.transactionType,
      detail: tx.provider,
      amountCents: cents(tx.amount),
      chargeCents: cents(tx.charge),
      href: `/records?tab=gcash&edit=${tx.id}`,
      created: tx.createdAt.getTime(),
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime() || b.created - a.created)
    .slice(0, RECENT_LIMIT);

  const [saleCount, expenseCount, gcashCount, debtCount, excessCount] = totalCounts;

  return {
    period,
    summary: {
      salesCents,
      expensesCents,
      gcashChargesCents,
      excessCents,
      revenueCents: revenueCents(salesCents, gcashChargesCents),
      netIncomeCents: netIncomeCents(salesCents, gcashChargesCents, expensesCents, excessCents),
      outstandingDebtCents,
      openDebtCount,
    },
    cashMovements: {
      cashInCents: movement("CASH_IN"),
      cashOutCents: movement("CASH_OUT"),
      loadCents: movement("LOAD"),
      count: gcashByType.reduce((sum, row) => sum + row._count, 0),
    },
    adjustments: { totalCents: cents(adjustmentsAgg._sum.amount), count: adjustmentsAgg._count },
    monthly: buildMonthlySeries(toMonthMap(monthlySales), toMonthMap(monthlyCharges), toMonthMap(monthlyExpenses), toMonthMap(monthlyExcess)),
    salesByCategory: topCategories(categoryRows.map((row) => ({ name: row.name, cents: cents(row.total) }))),
    recent: recent.map((row) => ({
      key: row.key,
      kind: row.kind,
      date: row.date,
      title: row.title,
      detail: row.detail,
      amountCents: row.amountCents,
      chargeCents: row.chargeCents,
      href: row.href,
    })),
    counts: { sales: salesAgg._count, expenses: expensesAgg._count, gcash: gcashByType.reduce((s, r) => s + r._count, 0), excess: excessAgg._count },
    isEmpty: saleCount + expenseCount + gcashCount + debtCount + excessCount === 0,
    earliestYear: earliest[0]?.year ?? null,
  };
}
