import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { parseDateInput, toDateInputValue } from "@/lib/dates";
import { buildReport, emptyRows } from "@/lib/reports/calc";
import { monthKey, selectionRanges } from "@/lib/reports/period";
import { MAX_REPORT_ROWS_PER_TYPE, type Report, type ReportRows, type ReportSelection } from "@/lib/reports/types";
import { decimalToCents } from "@/lib/money";
import { PAYMENT_METHOD_LABELS, type PaymentMethodValue } from "@/lib/sales/constants";

export class ReportTooLargeError extends Error {
  constructor() {
    super(`This report has more than ${MAX_REPORT_ROWS_PER_TYPE.toLocaleString("en-PH")} records of one type. Choose a shorter period.`);
    this.name = "ReportTooLargeError";
  }
}

const cents = (value: Prisma.Decimal) => decimalToCents(value);
const dateOf = (value: Date) => toDateInputValue(value);
const take = MAX_REPORT_ROWS_PER_TYPE + 1;

function dateFilter(selection: ReportSelection) {
  const ranges = selectionRanges(selection).map((range) => ({
    gte: parseDateInput(range.from),
    lte: parseDateInput(range.to),
  }));
  return ranges;
}

function guard<T>(rows: T[]): T[] {
  if (rows.length > MAX_REPORT_ROWS_PER_TYPE) throw new ReportTooLargeError();
  return rows;
}

/**
 * Fetches only the records whose TRANSACTION DATE falls in the selected months/dates,
 * for the selected types, for this user. Nothing is read from manually entered totals.
 */
export async function getReport(userId: string, selection: ReportSelection): Promise<Report> {
  const ranges = dateFilter(selection);
  const where = <K extends string>(field: K) =>
    ranges.length === 0 ? { [field]: { gte: new Date(0), lt: new Date(0) } } : { OR: ranges.map((range) => ({ [field]: range })) };
  const has = (type: string) => selection.types.some((t) => t === type);
  const rows: ReportRows = emptyRows();

  const [sales, gcash, expenses, payments, debts, adjustments] = await Promise.all([
    has("sales")
      ? db.sale.findMany({
          where: { userId, ...where("transactionDate") },
          orderBy: [{ transactionDate: "asc" }, { transactionNumber: "asc" }],
          take,
          select: {
            transactionDate: true,
            transactionNumber: true,
            customerName: true,
            paymentMethod: true,
            totalAmount: true,
            items: {
              orderBy: { createdAt: "asc" },
              select: { description: true, quantity: true, unitPrice: true, category: { select: { name: true } } },
            },
          },
        })
      : [],
    has("gcash")
      ? db.gcashTransaction.findMany({
          where: { userId, ...where("transactionDate") },
          orderBy: [{ transactionDate: "asc" }, { createdAt: "asc" }],
          take,
        })
      : [],
    has("expenses")
      ? db.expense.findMany({
          where: { userId, ...where("expenseDate") },
          orderBy: [{ expenseDate: "asc" }, { createdAt: "asc" }],
          take,
          select: { expenseDate: true, description: true, amount: true, notes: true, category: { select: { name: true } } },
        })
      : [],
    has("debts")
      ? db.debtPayment.findMany({
          where: { debt: { userId }, ...where("paymentDate") },
          orderBy: [{ paymentDate: "asc" }, { createdAt: "asc" }],
          take,
          select: { paymentDate: true, amount: true, notes: true, debt: { select: { name: true } } },
        })
      : [],
    has("debts")
      ? db.debt.findMany({
          where: { userId, ...where("debtDate") },
          orderBy: [{ debtDate: "asc" }, { createdAt: "asc" }],
          take,
          select: { debtDate: true, name: true, description: true, originalAmount: true },
        })
      : [],
    has("adjustments")
      ? db.monthlyAdjustment.findMany({
          where: { userId, ...where("adjustmentDate") },
          orderBy: [{ adjustmentDate: "asc" }, { createdAt: "asc" }],
          take,
        })
      : [],
  ]);

  rows.sales = guard(sales).map((sale) => ({
    date: dateOf(sale.transactionDate),
    number: sale.transactionNumber,
    customer: sale.customerName?.trim() ?? "",
    paymentMethod: PAYMENT_METHOD_LABELS[sale.paymentMethod as PaymentMethodValue] ?? sale.paymentMethod,
    items: sale.items.map((item) => `${item.category.name}: ${item.description} (${item.quantity} × ${item.unitPrice.toFixed(2)})`),
    totalCents: cents(sale.totalAmount),
  }));
  rows.gcash = guard(gcash).map((tx) => ({
    date: dateOf(tx.transactionDate),
    type: tx.transactionType,
    provider: tx.provider,
    amountCents: cents(tx.amount),
    chargeCents: cents(tx.charge),
    notes: tx.notes?.trim() ?? "",
  }));
  rows.expenses = guard(expenses).map((expense) => ({
    date: dateOf(expense.expenseDate),
    category: expense.category.name,
    description: expense.description,
    amountCents: cents(expense.amount),
    notes: expense.notes?.trim() ?? "",
  }));
  rows.debtPayments = guard(payments).map((payment) => ({
    date: dateOf(payment.paymentDate),
    debt: payment.debt.name,
    amountCents: cents(payment.amount),
    notes: payment.notes?.trim() ?? "",
  }));
  rows.debtsOpened = guard(debts).map((debt) => ({
    date: dateOf(debt.debtDate),
    debt: debt.name,
    description: debt.description?.trim() ?? "",
    originalCents: cents(debt.originalAmount),
  }));
  rows.adjustments = guard(adjustments).map((adjustment) => ({
    date: dateOf(adjustment.adjustmentDate),
    type: adjustment.adjustmentType,
    description: adjustment.description,
    amountCents: cents(adjustment.amount),
    notes: adjustment.notes?.trim() ?? "",
  }));

  return buildReport(selection, rows);
}

/** Earliest and latest months (YYYY-MM) that have any record, for the month picker. */
export async function getReportMonthBounds(userId: string): Promise<{ earliest: string | null; latest: string | null }> {
  const result = await db.$queryRaw<{ earliest: Date | null; latest: Date | null }[]>`
    SELECT MIN(d) AS earliest, MAX(d) AS latest FROM (
      SELECT "transactionDate" AS d FROM "Sale" WHERE "userId" = ${userId}
      UNION ALL SELECT "transactionDate" FROM "GcashTransaction" WHERE "userId" = ${userId}
      UNION ALL SELECT "expenseDate" FROM "Expense" WHERE "userId" = ${userId}
      UNION ALL SELECT "debtDate" FROM "Debt" WHERE "userId" = ${userId}
      UNION ALL SELECT p."paymentDate" FROM "DebtPayment" p JOIN "Debt" b ON b."id" = p."debtId" WHERE b."userId" = ${userId}
      UNION ALL SELECT "adjustmentDate" FROM "MonthlyAdjustment" WHERE "userId" = ${userId}
    ) t`;
  const row = result[0];
  const toKey = (date: Date | null) => (date ? monthKey(date.getUTCFullYear(), date.getUTCMonth() + 1) : null);
  return { earliest: toKey(row?.earliest ?? null), latest: toKey(row?.latest ?? null) };
}
