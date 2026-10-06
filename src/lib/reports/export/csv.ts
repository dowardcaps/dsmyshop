import {
  adjustmentTypeLabel,
  gcashProviderLabel,
  gcashTypeLabel,
} from "@/lib/reports/export/labels";
import type { Report } from "@/lib/reports/types";

export const CSV_COLUMNS = [
  "Date",
  "Type",
  "Reference",
  "Description",
  "Category / Provider / Method",
  "Amount",
  "GCash Charge",
  "Counts As",
  "Notes",
] as const;

const BOM = "﻿";

/** Quotes a field for CSV and neutralises spreadsheet formulas ("=1+1", "@SUM", "-cmd"). */
export function csvField(value: string | number): string {
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const money = (cents: number) => (cents / 100).toFixed(2);

interface CsvRow {
  date: string;
  order: number;
  cells: (string | number)[];
}

/**
 * One combined ledger of the selected transaction types, sorted by date.
 * "Counts As" labels each line so cash movements are never mistaken for income.
 * Encoded as UTF-8 with a byte-order mark and CRLF line ends so Excel opens it correctly.
 */
export function buildCsv(report: Report): string {
  const { rows } = report;
  const lines: CsvRow[] = [];

  rows.sales.forEach((r) =>
    lines.push({
      date: r.date,
      order: 0,
      cells: [r.date, "Sale", r.number, r.items.join("; "), r.paymentMethod, money(r.totalCents), "", "Revenue", r.customer ? `Customer: ${r.customer}` : ""],
    }),
  );
  rows.gcash.forEach((r) =>
    lines.push({
      date: r.date,
      order: 1,
      cells: [r.date, "GCash", "", gcashTypeLabel(r.type), gcashProviderLabel(r.provider), money(r.amountCents), money(r.chargeCents), "Cash movement (only the charge is revenue)", r.notes],
    }),
  );
  rows.expenses.forEach((r) =>
    lines.push({ date: r.date, order: 2, cells: [r.date, "Expense", "", r.description, r.category, money(r.amountCents), "", "Expense", r.notes] }),
  );
  rows.debtsOpened.forEach((r) =>
    lines.push({ date: r.date, order: 3, cells: [r.date, "Debt opened", r.debt, r.description, "", money(r.originalCents), "", "Debt owed (not revenue or expense)", ""] }),
  );
  rows.debtPayments.forEach((r) =>
    lines.push({ date: r.date, order: 4, cells: [r.date, "Debt payment", r.debt, "Payment", "", money(r.amountCents), "", "Debt payment (not revenue or expense)", r.notes] }),
  );
  rows.adjustments.forEach((r) =>
    lines.push({ date: r.date, order: 5, cells: [r.date, "Adjustment", "", r.description, adjustmentTypeLabel(r.type), money(r.amountCents), "", "Adjustment (separate from net income)", r.notes] }),
  );

  lines.sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);

  const out = [CSV_COLUMNS.map(csvField).join(",")];
  for (const line of lines) out.push(line.cells.map(csvField).join(","));
  return BOM + out.join("\r\n") + "\r\n";
}
