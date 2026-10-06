import {
  monthLabel,
  selectionFileLabel,
  selectionLabel,
  selectionMonthKeys,
} from "@/lib/reports/period";
import {
  REPORT_TYPES,
  type Report,
  type ReportMonth,
  type ReportRows,
  type ReportSelection,
  type ReportTotals,
  type ReportType,
} from "@/lib/reports/types";

/**
 * HOW THE NUMBERS ARE CALCULATED (shown to the user on the page, in Excel and in the PDF):
 *
 *   Revenue    = Sales + GCash charges
 *   Net income = Revenue - Expenses
 *
 * NOT counted in revenue or net income (reported separately instead):
 *   - GCash Cash In / Cash Out / Load amounts: money moved for customers, not income.
 *   - Debt payments: repaying money already owed, not a new expense (record the original cost as an expense).
 *   - Debts opened: money owed, not income or an expense.
 *   - Monthly adjustments (salary, reimbursements, other): reported on their own.
 *
 * Net income is only calculated when Sales, GCash and Expenses are all included.
 * Otherwise it is left blank rather than guessed.
 */
export const NET_INCOME_EXPLANATION = [
  "Revenue = Sales + GCash charges (the fees you earn).",
  "Net income = Revenue − Expenses.",
  "GCash Cash In, Cash Out and Load amounts are money moved for customers. They are never counted as sales or revenue.",
  "Debt payments and newly opened debts are not counted as expenses or revenue.",
  "Monthly adjustments (salary, reimbursements, other income) are shown separately and are not part of net income.",
  "Net income is only calculated when Sales, GCash and Expenses are all included in the report.",
];

const sum = <T>(items: readonly T[], pick: (item: T) => number) => items.reduce((total, item) => total + pick(item), 0);

export function includedTypes(selection: ReportSelection): Record<ReportType, boolean> {
  return Object.fromEntries(REPORT_TYPES.map((type) => [type, selection.types.includes(type)])) as Record<ReportType, boolean>;
}

/** Whether net income can be calculated for these included types. */
export const canCalculateNet = (included: Record<ReportType, boolean>) => included.sales && included.gcash && included.expenses;

export function emptyRows(): ReportRows {
  return { sales: [], gcash: [], expenses: [], debtPayments: [], debtsOpened: [], adjustments: [] };
}

/** Totals for a set of rows. Rows of types that are not included must already be empty. */
export function computeTotals(rows: ReportRows, included: Record<ReportType, boolean>): ReportTotals {
  const salesCents = sum(rows.sales, (r) => r.totalCents);
  const gcashChargesCents = sum(rows.gcash, (r) => r.chargeCents);
  const gcashOf = (type: string) => sum(rows.gcash.filter((r) => r.type === type), (r) => r.amountCents);
  const expensesCents = sum(rows.expenses, (r) => r.amountCents);
  const revenueCents = salesCents + gcashChargesCents;

  return {
    salesCents,
    gcashChargesCents,
    gcashCashInCents: gcashOf("CASH_IN"),
    gcashCashOutCents: gcashOf("CASH_OUT"),
    gcashLoadCents: gcashOf("LOAD"),
    revenueCents,
    expensesCents,
    debtPaymentsCents: sum(rows.debtPayments, (r) => r.amountCents),
    debtsOpenedCents: sum(rows.debtsOpened, (r) => r.originalCents),
    adjustmentsCents: sum(rows.adjustments, (r) => r.amountCents),
    netIncomeCents: canCalculateNet(included) ? revenueCents - expensesCents : null,
    transactionCount:
      rows.sales.length + rows.gcash.length + rows.expenses.length + rows.debtPayments.length + rows.debtsOpened.length + rows.adjustments.length,
  };
}

const monthOf = (date: string) => date.slice(0, 7);

function rowsForMonth(rows: ReportRows, key: string): ReportRows {
  const inMonth = <T extends { date: string }>(items: T[]) => items.filter((item) => monthOf(item.date) === key);
  return {
    sales: inMonth(rows.sales),
    gcash: inMonth(rows.gcash),
    expenses: inMonth(rows.expenses),
    debtPayments: inMonth(rows.debtPayments),
    debtsOpened: inMonth(rows.debtsOpened),
    adjustments: inMonth(rows.adjustments),
  };
}

/** Builds the full report (totals, monthly table, counts) from already-fetched rows. */
export function buildReport(selection: ReportSelection, rows: ReportRows): Report {
  const included = includedTypes(selection);
  const monthly: ReportMonth[] = selectionMonthKeys(selection).map((key) => ({
    key,
    label: monthLabel(key),
    ...computeTotals(rowsForMonth(rows, key), included),
  }));

  return {
    selection,
    periodLabel: selectionLabel(selection),
    fileLabel: selectionFileLabel(selection),
    included,
    rows,
    totals: computeTotals(rows, included),
    monthly,
    counts: {
      sales: rows.sales.length,
      gcash: rows.gcash.length,
      expenses: rows.expenses.length,
      debts: rows.debtPayments.length + rows.debtsOpened.length,
      adjustments: rows.adjustments.length,
    },
  };
}
