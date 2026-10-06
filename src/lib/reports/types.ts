export const REPORT_TYPES = ["sales", "gcash", "expenses", "debts", "adjustments"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  sales: "Sales",
  gcash: "GCash transactions",
  expenses: "Expenses",
  debts: "Debts and payments",
  adjustments: "Monthly adjustments",
};

export const REPORT_MODES = ["months", "range", "dates"] as const;
export type ReportMode = (typeof REPORT_MODES)[number];

export const REPORT_MODE_LABELS: Record<ReportMode, string> = {
  months: "Pick months",
  range: "Month range",
  dates: "Custom dates",
};

export const REPORT_EXPORT_FORMATS = ["xlsx", "csv", "pdf"] as const;
export type ReportExportFormat = (typeof REPORT_EXPORT_FORMATS)[number];

/** Upper bound on one report. Keeps exports fast and within serverless limits. */
export const MAX_REPORT_ROWS_PER_TYPE = 20000;
export const MAX_REPORT_MONTHS = 120;

/** What the user selected. Dates and months are plain strings (YYYY-MM, YYYY-MM-DD). */
export interface ReportSelection {
  mode: ReportMode;
  /** mode "months": every selected month. mode "range": every month from start to end. */
  months: string[];
  /** mode "dates": inclusive custom range. */
  from: string | null;
  to: string | null;
  types: ReportType[];
}

export interface DateRange {
  from: string;
  to: string;
}

// ───────── rows (all dates are YYYY-MM-DD, money in integer centavos) ─────────

export interface ReportSaleRow {
  date: string;
  number: string;
  customer: string;
  paymentMethod: string;
  /** One line per item: "Category: description (qty × unit)". */
  items: string[];
  totalCents: number;
}

export interface ReportGcashRow {
  date: string;
  type: string;
  provider: string;
  amountCents: number;
  chargeCents: number;
  notes: string;
}

export interface ReportExpenseRow {
  date: string;
  category: string;
  description: string;
  amountCents: number;
  notes: string;
}

export interface ReportDebtPaymentRow {
  date: string;
  debt: string;
  amountCents: number;
  notes: string;
}

export interface ReportDebtOpenedRow {
  date: string;
  debt: string;
  description: string;
  originalCents: number;
}

export interface ReportAdjustmentRow {
  date: string;
  type: string;
  description: string;
  amountCents: number;
  notes: string;
}

export interface ReportRows {
  sales: ReportSaleRow[];
  gcash: ReportGcashRow[];
  expenses: ReportExpenseRow[];
  debtPayments: ReportDebtPaymentRow[];
  debtsOpened: ReportDebtOpenedRow[];
  adjustments: ReportAdjustmentRow[];
}

// ───────── computed report ─────────

export interface ReportTotals {
  salesCents: number;
  gcashChargesCents: number;
  gcashCashInCents: number;
  gcashCashOutCents: number;
  gcashLoadCents: number;
  revenueCents: number;
  expensesCents: number;
  debtPaymentsCents: number;
  debtsOpenedCents: number;
  adjustmentsCents: number;
  /** null when sales, GCash and expenses are not all included, so it cannot be calculated honestly. */
  netIncomeCents: number | null;
  transactionCount: number;
}

export interface ReportMonth extends ReportTotals {
  /** "2026-02" */
  key: string;
  label: string;
}

export interface Report {
  selection: ReportSelection;
  periodLabel: string;
  fileLabel: string;
  included: Record<ReportType, boolean>;
  rows: ReportRows;
  totals: ReportTotals;
  /** One entry per calendar month with a selected day, in order (empty months included). */
  monthly: ReportMonth[];
  counts: Record<ReportType, number>;
}
