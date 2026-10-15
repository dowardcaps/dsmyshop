import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { parseDateInput } from "@/lib/dates";
import { decimalToCents } from "@/lib/money";
import {
  addLedgerRow,
  emptyComponents,
  type CashComponents,
} from "@/lib/finance/components";

/**
 * Every record that moves net income, as (kind, date, amount) rows for one user.
 * Salary paid out = each cash advance on its date + the rest of a pay date on the day it was marked paid.
 */
function ledgerRows(userId: string): Prisma.Sql {
  return Prisma.sql`
    SELECT 'sales' AS k, "transactionDate" AS d, "totalAmount" AS a FROM "Sale" WHERE "userId" = ${userId}
    UNION ALL SELECT 'charges', "transactionDate", "charge" FROM "GcashTransaction" WHERE "userId" = ${userId}
    UNION ALL SELECT 'expenses', "expenseDate", "amount" FROM "Expense" WHERE "userId" = ${userId}
    UNION ALL SELECT 'excess', "excessDate", "amount" FROM "ExcessMoney" WHERE "userId" = ${userId}
    UNION ALL SELECT 'reimbursements', "reimbursementDate", "amount" FROM "Reimbursement" WHERE "userId" = ${userId}
    UNION ALL SELECT 'short', "shortDate", "amount" FROM "CashShort" WHERE "userId" = ${userId}
    UNION ALL SELECT 'salary', "advanceDate", "amount" FROM "SalaryAdvance" WHERE "userId" = ${userId}
    UNION ALL
      SELECT 'salary', p."paidOn",
             p."grossAmount" - COALESCE((SELECT SUM(a."amount") FROM "SalaryAdvance" a WHERE a."periodId" = p."id"), 0)
      FROM "SalaryPeriod" p
      WHERE p."userId" = ${userId} AND p."paidOn" IS NOT NULL`;
}

type Row = { k: string; ym: string | null; total: Prisma.Decimal | null };

/** Totals of every component between two dates (inclusive), as one components object. */
export async function getComponentsBetween(
  userId: string,
  from: string,
  to: string,
): Promise<CashComponents> {
  const rows = await db.$queryRaw<Row[]>`
    SELECT t.k, NULL::text AS ym, SUM(t.a) AS total
    FROM (${ledgerRows(userId)}) t
    WHERE t.d BETWEEN ${parseDateInput(from)} AND ${parseDateInput(to)}
    GROUP BY t.k`;
  const result = emptyComponents();
  for (const row of rows)
    addLedgerRow(result, row.k, row.total ? decimalToCents(row.total) : 0);
  return result;
}

/** Totals of every component strictly before a date. This is the "brought forward" balance. */
export async function getComponentsBefore(
  userId: string,
  before: string,
): Promise<CashComponents> {
  const rows = await db.$queryRaw<Row[]>`
    SELECT t.k, NULL::text AS ym, SUM(t.a) AS total
    FROM (${ledgerRows(userId)}) t
    WHERE t.d < ${parseDateInput(before)}
    GROUP BY t.k`;
  const result = emptyComponents();
  for (const row of rows)
    addLedgerRow(result, row.k, row.total ? decimalToCents(row.total) : 0);
  return result;
}

/** Components per calendar month ("2026-07") between two dates (inclusive). */
export async function getComponentsByMonth(
  userId: string,
  from: string,
  to: string,
): Promise<Map<string, CashComponents>> {
  const rows = await db.$queryRaw<Row[]>`
    SELECT t.k, to_char(t.d, 'YYYY-MM') AS ym, SUM(t.a) AS total
    FROM (${ledgerRows(userId)}) t
    WHERE t.d BETWEEN ${parseDateInput(from)} AND ${parseDateInput(to)}
    GROUP BY t.k, 2`;
  const months = new Map<string, CashComponents>();
  for (const row of rows) {
    if (!row.ym) continue;
    const entry = months.get(row.ym) ?? emptyComponents();
    addLedgerRow(entry, row.k, row.total ? decimalToCents(row.total) : 0);
    months.set(row.ym, entry);
  }
  return months;
}

export interface LedgerRangeRow {
  date: string;
  key: "excess" | "reimbursements" | "short" | "salary";
  cents: number;
}

/** The records that adjust net income (not sales, charges or expenses), inside any of the given date ranges. */
export async function getAdjustmentRowsInRanges(
  userId: string,
  ranges: { from: string; to: string }[],
): Promise<LedgerRangeRow[]> {
  if (ranges.length === 0) return [];
  const inRange = Prisma.join(
    ranges.map(
      (range) =>
        Prisma.sql`(t.d BETWEEN ${parseDateInput(range.from)} AND ${parseDateInput(range.to)})`,
    ),
    " OR ",
  );
  const rows = await db.$queryRaw<{ k: string; d: Date; a: Prisma.Decimal }[]>`
    SELECT t.k, t.d, t.a
    FROM (${ledgerRows(userId)}) t
    WHERE t.k IN ('excess', 'reimbursements', 'short', 'salary') AND (${inRange})
    ORDER BY t.d`;
  return rows.map((row) => ({
    date: row.d.toISOString().slice(0, 10),
    key: row.k as LedgerRangeRow["key"],
    cents: decimalToCents(row.a),
  }));
}

export interface DailyIncome {
  salesCents: number;
  gcashChargesCents: number;
  excessCents: number;
  /** Sales + GCash charges + excess money. */
  totalCents: number;
}

/** Money that came in on each day (sales + GCash charges + excess money) between two dates, keyed by "YYYY-MM-DD". Days with nothing are left out. */
export async function getDailyIncome(
  userId: string,
  from: string,
  to: string,
): Promise<Map<string, DailyIncome>> {
  const rows = await db.$queryRaw<
    { k: string; d: Date; total: Prisma.Decimal | null }[]
  >`
    SELECT t.k, t.d, SUM(t.a) AS total
    FROM (${ledgerRows(userId)}) t
    WHERE t.k IN ('sales', 'charges', 'excess') AND t.d BETWEEN ${parseDateInput(from)} AND ${parseDateInput(to)}
    GROUP BY t.k, t.d`;
  const days = new Map<string, DailyIncome>();
  for (const row of rows) {
    const date = row.d.toISOString().slice(0, 10);
    const entry = days.get(date) ?? {
      salesCents: 0,
      gcashChargesCents: 0,
      excessCents: 0,
      totalCents: 0,
    };
    const cents = row.total ? decimalToCents(row.total) : 0;
    if (row.k === "sales") entry.salesCents += cents;
    else if (row.k === "charges") entry.gcashChargesCents += cents;
    else entry.excessCents += cents;
    entry.totalCents += cents;
    days.set(date, entry);
  }
  return days;
}
