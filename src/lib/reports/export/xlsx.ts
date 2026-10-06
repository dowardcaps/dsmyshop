import ExcelJS from "exceljs";

import { NET_INCOME_EXPLANATION } from "@/lib/reports/calc";
import {
  adjustmentTypeLabel,
  excelDate,
  gcashProviderLabel,
  gcashTypeLabel,
  generatedAtText,
} from "@/lib/reports/export/labels";
import { REPORT_TYPE_LABELS, REPORT_TYPES, type Report } from "@/lib/reports/types";

const PESO_FORMAT = '"₱"#,##0.00;[Red]-"₱"#,##0.00';
const DATE_FORMAT = "mmm d, yyyy";
const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B7A4B" } };
const SECTION_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F3EE" } };
const TOTAL_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
const BORDER: Partial<ExcelJS.Borders> = { bottom: { style: "thin", color: { argb: "FFD1D5DB" } } };

const peso = (cents: number) => cents / 100;

interface Column<T> {
  header: string;
  width: number;
  value: (row: T) => string | number | Date;
  format?: "date" | "money";
  wrap?: boolean;
}

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = HEADER_FILL;
  row.alignment = { vertical: "middle", wrapText: true };
  row.height = 20;
}

/** Adds a detail worksheet: bold header, frozen, filtered, formatted, with a SUM totals row. */
function addDetailSheet<T>(
  workbook: ExcelJS.Workbook,
  name: string,
  title: string,
  rows: T[],
  columns: Column<T>[],
  totals: { column: number; cents: number }[],
) {
  const sheet = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 3 }] });
  sheet.columns = columns.map((column) => ({ width: column.width }));
  sheet.mergeCells(1, 1, 1, columns.length);
  sheet.getCell(1, 1).value = title;
  sheet.getCell(1, 1).font = { bold: true, size: 14 };

  const header = sheet.getRow(3);
  columns.forEach((column, index) => (header.getCell(index + 1).value = column.header));
  styleHeader(header);

  rows.forEach((row, index) => {
    const excelRow = sheet.getRow(4 + index);
    columns.forEach((column, i) => {
      const cell = excelRow.getCell(i + 1);
      cell.value = column.value(row);
      if (column.format === "date") cell.numFmt = DATE_FORMAT;
      if (column.format === "money") cell.numFmt = PESO_FORMAT;
      cell.alignment = { vertical: "top", wrapText: column.wrap ?? false, horizontal: column.format === "date" ? "left" : undefined };
      cell.border = BORDER;
    });
  });

  const first = 4;
  const last = 3 + rows.length;
  const totalRow = sheet.getRow(last + 1);
  totalRow.getCell(1).value = "Total";
  for (const total of totals) {
    const letter = sheet.getColumn(total.column).letter;
    totalRow.getCell(total.column).value = rows.length
      ? { formula: `SUM(${letter}${first}:${letter}${last})`, result: peso(total.cents) }
      : 0;
    totalRow.getCell(total.column).numFmt = PESO_FORMAT;
  }
  totalRow.font = { bold: true };
  totalRow.fill = TOTAL_FILL;
  if (rows.length) sheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: last, column: columns.length } };
  return sheet;
}

function addSummarySheet(workbook: ExcelJS.Workbook, report: Report) {
  const { totals, included } = report;
  const sheet = workbook.addWorksheet("Summary");
  sheet.columns = [{ width: 34 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 14 }];

  sheet.getCell("A1").value = "Financial Report";
  sheet.getCell("A1").font = { bold: true, size: 16 };
  const meta: [string, string][] = [
    ["Reporting period", report.periodLabel],
    ["Includes", REPORT_TYPES.filter((t) => included[t]).map((t) => REPORT_TYPE_LABELS[t]).join(", ")],
    ["Generated", `${generatedAtText()} (Asia/Manila)`],
  ];
  meta.forEach(([label, value], i) => {
    sheet.getCell(3 + i, 1).value = label;
    sheet.getCell(3 + i, 1).font = { bold: true };
    sheet.getCell(3 + i, 2).value = value;
  });

  let r = 7;
  const section = (title: string) => {
    sheet.mergeCells(r, 1, r, 3);
    const cell = sheet.getCell(r, 1);
    cell.value = title;
    cell.font = { bold: true };
    cell.fill = SECTION_FILL;
    r += 1;
  };
  const line = (label: string, cents: number | null, note = "", bold = false) => {
    sheet.getCell(r, 1).value = label;
    const amount = sheet.getCell(r, 2);
    if (cents === null) {
      amount.value = "Not calculated";
      amount.alignment = { horizontal: "right" };
    } else {
      amount.value = peso(cents);
      amount.numFmt = PESO_FORMAT;
    }
    sheet.getCell(r, 3).value = note;
    sheet.getCell(r, 3).font = { color: { argb: "FF6B7280" }, italic: true };
    if (bold) sheet.getRow(r).font = { bold: true };
    r += 1;
  };
  const off = (on: boolean, cents: number) => (on ? cents : null);
  const notIncluded = (on: boolean) => (on ? "" : "Not included in this report");

  section("Income and net income");
  line("Total sales", off(included.sales, totals.salesCents), notIncluded(included.sales));
  line("Total GCash charges", off(included.gcash, totals.gcashChargesCents), notIncluded(included.gcash) || "Fees earned. Counted as revenue");
  line("Total revenue", included.sales && included.gcash ? totals.revenueCents : null, "Sales + GCash charges", true);
  line("Total expenses", off(included.expenses, totals.expensesCents), notIncluded(included.expenses));
  line("Net income", totals.netIncomeCents, totals.netIncomeCents === null ? "Needs sales, GCash and expenses all included" : "Revenue − expenses", true);
  r += 1;
  section("Shown separately (not part of net income)");
  line("Total debt payments", off(included.debts, totals.debtPaymentsCents), notIncluded(included.debts) || "Repaying money owed. Not an expense");
  line("Debts opened", off(included.debts, totals.debtsOpenedCents), notIncluded(included.debts) || "Money owed. Not income");
  line("Total adjustments", off(included.adjustments, totals.adjustmentsCents), notIncluded(included.adjustments) || "Salary, reimbursements, other");
  line("GCash Cash In (moved)", off(included.gcash, totals.gcashCashInCents), "Cash movement, not income");
  line("GCash Cash Out (moved)", off(included.gcash, totals.gcashCashOutCents), "Cash movement, not income");
  line("GCash Load (moved)", off(included.gcash, totals.gcashLoadCents), "Cash movement, not income");
  sheet.getCell(r, 1).value = "Transaction count";
  sheet.getCell(r, 2).value = totals.transactionCount;
  r += 2;

  section("How net income is calculated");
  for (const text of NET_INCOME_EXPLANATION) {
    sheet.mergeCells(r, 1, r, 8);
    sheet.getCell(r, 1).value = text;
    sheet.getCell(r, 1).alignment = { wrapText: true, vertical: "top" };
    r += 1;
  }
  r += 1;

  if (report.monthly.length > 1) {
    section("Monthly summary");
    const headers = ["Month", "Sales", "GCash charges", "Revenue", "Expenses", "Net income", "Debt payments", "Adjustments", "Transactions"];
    headers.forEach((text, i) => (sheet.getCell(r, i + 1).value = text));
    styleHeader(sheet.getRow(r));
    r += 1;
    const firstRow = r;
    for (const month of report.monthly) {
      const values: (string | number | null)[] = [
        month.label,
        peso(month.salesCents),
        peso(month.gcashChargesCents),
        peso(month.revenueCents),
        peso(month.expensesCents),
        month.netIncomeCents === null ? null : peso(month.netIncomeCents),
        peso(month.debtPaymentsCents),
        peso(month.adjustmentsCents),
        month.transactionCount,
      ];
      values.forEach((value, i) => {
        const cell = sheet.getCell(r, i + 1);
        cell.value = value ?? "Not calculated";
        if (i >= 1 && i <= 7) cell.numFmt = PESO_FORMAT;
        cell.border = BORDER;
      });
      r += 1;
    }
    const lastRow = r - 1;
    sheet.getCell(r, 1).value = "Combined total";
    const sums: (number | null)[] = [
      totals.salesCents,
      totals.gcashChargesCents,
      totals.revenueCents,
      totals.expensesCents,
      totals.netIncomeCents,
      totals.debtPaymentsCents,
      totals.adjustmentsCents,
      totals.transactionCount,
    ];
    sums.forEach((value, i) => {
      const col = i + 2;
      const letter = sheet.getColumn(col).letter;
      const cell = sheet.getCell(r, col);
      if (value === null) cell.value = "Not calculated";
      else {
        cell.value = { formula: `SUM(${letter}${firstRow}:${letter}${lastRow})`, result: col === 9 ? value : peso(value) };
        if (col !== 9) cell.numFmt = PESO_FORMAT;
      }
    });
    sheet.getRow(r).font = { bold: true };
    sheet.getRow(r).fill = TOTAL_FILL;
  }
}

/** Builds the Excel workbook. Only worksheets for the selected types are included. */
export async function buildXlsx(report: Report): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DS Finance";
  workbook.created = new Date();

  const { rows, totals, included } = report;
  addSummarySheet(workbook, report);

  if (included.sales) {
    addDetailSheet(
      workbook,
      "Sales",
      `Sales: ${report.periodLabel}`,
      rows.sales,
      [
        { header: "Date", width: 14, value: (r) => excelDate(r.date), format: "date" },
        { header: "Transaction No.", width: 18, value: (r) => r.number },
        { header: "Customer", width: 22, value: (r) => r.customer },
        { header: "Payment method", width: 16, value: (r) => r.paymentMethod },
        { header: "Items", width: 60, value: (r) => r.items.join("\n"), wrap: true },
        { header: "Total", width: 16, value: (r) => peso(r.totalCents), format: "money" },
      ],
      [{ column: 6, cents: totals.salesCents }],
    );
  }
  if (included.gcash) {
    addDetailSheet(
      workbook,
      "GCash",
      `GCash transactions: ${report.periodLabel} (Amount is money moved, not income. Charge is revenue.)`,
      rows.gcash,
      [
        { header: "Date", width: 14, value: (r) => excelDate(r.date), format: "date" },
        { header: "Type", width: 14, value: (r) => gcashTypeLabel(r.type) },
        { header: "Provider", width: 14, value: (r) => gcashProviderLabel(r.provider) },
        { header: "Amount (moved)", width: 18, value: (r) => peso(r.amountCents), format: "money" },
        { header: "Charge (revenue)", width: 18, value: (r) => peso(r.chargeCents), format: "money" },
        { header: "Notes", width: 40, value: (r) => r.notes, wrap: true },
      ],
      [
        { column: 4, cents: totals.gcashCashInCents + totals.gcashCashOutCents + totals.gcashLoadCents },
        { column: 5, cents: totals.gcashChargesCents },
      ],
    );
  }
  if (included.expenses) {
    addDetailSheet(
      workbook,
      "Expenses",
      `Expenses: ${report.periodLabel}`,
      rows.expenses,
      [
        { header: "Date", width: 14, value: (r) => excelDate(r.date), format: "date" },
        { header: "Category", width: 20, value: (r) => r.category },
        { header: "Description", width: 44, value: (r) => r.description, wrap: true },
        { header: "Amount", width: 16, value: (r) => peso(r.amountCents), format: "money" },
        { header: "Notes", width: 40, value: (r) => r.notes, wrap: true },
      ],
      [{ column: 4, cents: totals.expensesCents }],
    );
  }
  if (included.debts) {
    const sheet = addDetailSheet(
      workbook,
      "Debts",
      `Debt payments: ${report.periodLabel} (not counted as expenses or revenue)`,
      rows.debtPayments,
      [
        { header: "Date", width: 14, value: (r) => excelDate(r.date), format: "date" },
        { header: "Debt", width: 30, value: (r) => r.debt },
        { header: "Payment", width: 16, value: (r) => peso(r.amountCents), format: "money" },
        { header: "Notes", width: 44, value: (r) => r.notes, wrap: true },
      ],
      [{ column: 3, cents: totals.debtPaymentsCents }],
    );
    // second table: debts opened in the period
    let r = 4 + rows.debtPayments.length + 3;
    sheet.getCell(r, 1).value = "Debts opened in this period (money owed, not income)";
    sheet.getCell(r, 1).font = { bold: true };
    r += 1;
    ["Date", "Debt", "Original amount", "Description"].forEach((text, i) => (sheet.getCell(r, i + 1).value = text));
    styleHeader(sheet.getRow(r));
    r += 1;
    const firstRow = r;
    for (const debt of rows.debtsOpened) {
      sheet.getCell(r, 1).value = excelDate(debt.date);
      sheet.getCell(r, 1).numFmt = DATE_FORMAT;
      sheet.getCell(r, 1).alignment = { horizontal: "left" };
      sheet.getCell(r, 2).value = debt.debt;
      sheet.getCell(r, 3).value = peso(debt.originalCents);
      sheet.getCell(r, 3).numFmt = PESO_FORMAT;
      sheet.getCell(r, 4).value = debt.description;
      r += 1;
    }
    sheet.getCell(r, 1).value = "Total";
    sheet.getCell(r, 3).value = rows.debtsOpened.length
      ? { formula: `SUM(C${firstRow}:C${r - 1})`, result: peso(totals.debtsOpenedCents) }
      : 0;
    sheet.getCell(r, 3).numFmt = PESO_FORMAT;
    sheet.getRow(r).font = { bold: true };
    sheet.getRow(r).fill = TOTAL_FILL;
  }
  if (included.adjustments) {
    addDetailSheet(
      workbook,
      "Adjustments",
      `Monthly adjustments: ${report.periodLabel} (separate from net income)`,
      rows.adjustments,
      [
        { header: "Date", width: 14, value: (r) => excelDate(r.date), format: "date" },
        { header: "Type", width: 18, value: (r) => adjustmentTypeLabel(r.type) },
        { header: "Description", width: 40, value: (r) => r.description, wrap: true },
        { header: "Amount", width: 16, value: (r) => peso(r.amountCents), format: "money" },
        { header: "Notes", width: 40, value: (r) => r.notes, wrap: true },
      ],
      [{ column: 4, cents: totals.adjustmentsCents }],
    );
  }

  const data = await workbook.xlsx.writeBuffer();
  return Buffer.from(data);
}
