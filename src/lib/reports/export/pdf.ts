import { jsPDF } from "jspdf";
import { autoTable, type CellDef, type RowInput } from "jspdf-autotable";

import { NET_INCOME_EXPLANATION } from "@/lib/reports/calc";
import { LIBERATION_SANS_BOLD_BASE64 } from "@/lib/reports/export/fonts/liberation-sans-bold";
import { LIBERATION_SANS_REGULAR_BASE64 } from "@/lib/reports/export/fonts/liberation-sans-regular";
import {
  adjustmentTypeLabel,
  displayDate,
  gcashProviderLabel,
  gcashTypeLabel,
  generatedAtText,
  pesoText,
} from "@/lib/reports/export/labels";
import { REPORT_TYPE_LABELS, REPORT_TYPES, type Report } from "@/lib/reports/types";

const FONT = "LiberationSans";
const MARGIN = 14;
const GREEN: [number, number, number] = [11, 122, 75];
const GREY: [number, number, number] = [107, 114, 128];
const LIGHT: [number, number, number] = [243, 244, 246];

type Doc = jsPDF & { lastAutoTable?: { finalY: number } };

function setupFonts(doc: jsPDF) {
  doc.addFileToVFS("LiberationSans-Regular.ttf", LIBERATION_SANS_REGULAR_BASE64);
  doc.addFont("LiberationSans-Regular.ttf", FONT, "normal");
  doc.addFileToVFS("LiberationSans-Bold.ttf", LIBERATION_SANS_BOLD_BASE64);
  doc.addFont("LiberationSans-Bold.ttf", FONT, "bold");
  doc.setFont(FONT, "normal");
}

const right = (content: string): CellDef => ({ content, styles: { halign: "right" } });

/** Builds the printable PDF. Tables wrap long text and continue across pages with repeated headers. */
export function buildPdf(report: Report): Buffer {
  const doc: Doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  setupFonts(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usable = pageWidth - MARGIN * 2;
  const { totals, included, rows } = report;

  const tableDefaults = {
    margin: { left: MARGIN, right: MARGIN, bottom: 16 },
    theme: "grid" as const,
    styles: { font: FONT, fontSize: 8, cellPadding: 1.8, overflow: "linebreak" as const, lineColor: [229, 231, 235] as [number, number, number], lineWidth: 0.1, valign: "top" as const },
    headStyles: { fillColor: GREEN, textColor: 255, fontStyle: "bold" as const },
    footStyles: { fillColor: LIGHT, textColor: 20, fontStyle: "bold" as const },
    showHead: "everyPage" as const,
    showFoot: "lastPage" as const,
    rowPageBreak: "avoid" as const,
  };

  let y = MARGIN;
  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 16) {
      doc.addPage();
      y = MARGIN;
    }
  };
  const heading = (text: string, size = 12) => {
    ensureSpace(14);
    doc.setFont(FONT, "bold");
    doc.setFontSize(size);
    doc.setTextColor(20);
    doc.text(text, MARGIN, y);
    y += size / 2 + 1;
  };
  const note = (text: string, color: [number, number, number] = GREY) => {
    doc.setFont(FONT, "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, usable) as string[];
    ensureSpace(lines.length * 4 + 2);
    doc.text(lines, MARGIN, y);
    y += lines.length * 4 + 1;
  };
  const afterTable = () => {
    y = (doc.lastAutoTable?.finalY ?? y) + 8;
  };

  // ── title block ──
  doc.setFont(FONT, "bold");
  doc.setFontSize(20);
  doc.setTextColor(...GREEN);
  doc.text("Financial Report", MARGIN, y + 6);
  y += 13;
  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text(`Reporting period: ${report.periodLabel}`, MARGIN, y);
  y += 5.5;
  doc.setFont(FONT, "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text(`Includes: ${REPORT_TYPES.filter((t) => included[t]).map((t) => REPORT_TYPE_LABELS[t]).join(", ")}`, MARGIN, y);
  y += 4.5;
  doc.text(`Generated ${generatedAtText()} (Asia/Manila)`, MARGIN, y);
  y += 8;

  // ── summary ──
  heading("Summary");
  const off = (on: boolean, cents: number) => (on ? pesoText(cents) : "Not included");
  const summaryRows: RowInput[] = [
    ["Total sales", right(off(included.sales, totals.salesCents))],
    ["Total GCash charges (revenue)", right(off(included.gcash, totals.gcashChargesCents))],
    [{ content: "Total revenue", styles: { fontStyle: "bold" } }, right(included.sales && included.gcash ? pesoText(totals.revenueCents) : "Not calculated")],
    ["Total expenses", right(off(included.expenses, totals.expensesCents))],
    [
      { content: "Net income", styles: { fontStyle: "bold" } },
      { content: totals.netIncomeCents === null ? "Not calculated" : pesoText(totals.netIncomeCents), styles: { halign: "right", fontStyle: "bold" } },
    ],
    [{ content: "Shown separately (not part of net income)", colSpan: 2, styles: { fillColor: LIGHT, fontStyle: "bold" } }],
    ["Total debt payments", right(off(included.debts, totals.debtPaymentsCents))],
    ["Debts opened", right(off(included.debts, totals.debtsOpenedCents))],
    ["Total adjustments", right(off(included.adjustments, totals.adjustmentsCents))],
    ["GCash Cash In (money moved)", right(off(included.gcash, totals.gcashCashInCents))],
    ["GCash Cash Out (money moved)", right(off(included.gcash, totals.gcashCashOutCents))],
    ["GCash Load (money moved)", right(off(included.gcash, totals.gcashLoadCents))],
    ["Transaction count", right(totals.transactionCount.toLocaleString("en-PH"))],
  ];
  autoTable(doc, { ...tableDefaults, startY: y, body: summaryRows, tableWidth: usable, columnStyles: { 0: { cellWidth: usable * 0.62 }, 1: { cellWidth: usable * 0.38 } } });
  afterTable();

  heading("How net income is calculated", 10);
  for (const line of NET_INCOME_EXPLANATION) note(`•  ${line}`);
  y += 4;

  // ── monthly breakdown ──
  if (report.monthly.length > 1) {
    heading("Monthly breakdown");
    const money = (cents: number | null) => (cents === null ? "n/a" : pesoText(cents));
    autoTable(doc, {
      ...tableDefaults,
      startY: y,
      head: [["Month", "Sales", "GCash charges", "Expenses", "Net income", "Debt pmts", "Adjust.", "Txns"]],
      body: report.monthly.map((m) => [
        m.label,
        right(money(included.sales ? m.salesCents : null)),
        right(money(included.gcash ? m.gcashChargesCents : null)),
        right(money(included.expenses ? m.expensesCents : null)),
        right(money(m.netIncomeCents)),
        right(money(included.debts ? m.debtPaymentsCents : null)),
        right(money(included.adjustments ? m.adjustmentsCents : null)),
        right(String(m.transactionCount)),
      ]),
      foot: [[
        "Combined total",
        right(money(included.sales ? totals.salesCents : null)),
        right(money(included.gcash ? totals.gcashChargesCents : null)),
        right(money(included.expenses ? totals.expensesCents : null)),
        right(money(totals.netIncomeCents)),
        right(money(included.debts ? totals.debtPaymentsCents : null)),
        right(money(included.adjustments ? totals.adjustmentsCents : null)),
        right(String(totals.transactionCount)),
      ]],
      styles: { ...tableDefaults.styles, fontSize: 7.5 },
    });
    afterTable();
  }

  // ── detailed transactions ──
  const detail = <T,>(title: string, subtitle: string | null, head: string[], items: T[], toRow: (item: T) => RowInput, foot: RowInput | null, columnStyles: Record<number, object>) => {
    heading(title);
    if (subtitle) note(subtitle);
    if (items.length === 0) {
      note("No records in this period.");
      y += 4;
      return;
    }
    autoTable(doc, { ...tableDefaults, startY: y, head: [head], body: items.map(toRow), foot: foot ? [foot] : undefined, columnStyles });
    afterTable();
  };
  const sumLabel = (colSpan: number, text: string): CellDef => ({ content: text, colSpan, styles: { halign: "right" } });

  if (included.sales) {
    detail(
      "Sales",
      null,
      ["Date", "No.", "Customer", "Method", "Items", "Total"],
      rows.sales,
      (r) => [displayDate(r.date), r.number, r.customer || "—", r.paymentMethod, r.items.join("\n"), right(pesoText(r.totalCents))],
      [sumLabel(5, "Total sales"), right(pesoText(totals.salesCents))],
      { 0: { cellWidth: 22 }, 1: { cellWidth: 22 }, 2: { cellWidth: 24 }, 3: { cellWidth: 18 }, 4: { cellWidth: "auto" }, 5: { cellWidth: 24, halign: "right" } },
    );
  }
  if (included.gcash) {
    detail(
      "GCash transactions",
      "Amount is money moved for customers and is not income. Only the charge is revenue.",
      ["Date", "Type", "Provider", "Amount (moved)", "Charge", "Notes"],
      rows.gcash,
      (r) => [displayDate(r.date), gcashTypeLabel(r.type), gcashProviderLabel(r.provider), right(pesoText(r.amountCents)), right(pesoText(r.chargeCents)), r.notes],
      [sumLabel(3, "Totals"), right(pesoText(totals.gcashCashInCents + totals.gcashCashOutCents + totals.gcashLoadCents)), right(pesoText(totals.gcashChargesCents)), ""],
      { 0: { cellWidth: 22 }, 1: { cellWidth: 20 }, 2: { cellWidth: 20 }, 3: { cellWidth: 30, halign: "right" }, 4: { cellWidth: 24, halign: "right" }, 5: { cellWidth: "auto" } },
    );
  }
  if (included.expenses) {
    detail(
      "Expenses",
      null,
      ["Date", "Category", "Description", "Amount"],
      rows.expenses,
      (r) => [displayDate(r.date), r.category, r.notes ? `${r.description}\n${r.notes}` : r.description, right(pesoText(r.amountCents))],
      [sumLabel(3, "Total expenses"), right(pesoText(totals.expensesCents))],
      { 0: { cellWidth: 24 }, 1: { cellWidth: 34 }, 2: { cellWidth: "auto" }, 3: { cellWidth: 28, halign: "right" } },
    );
  }
  if (included.debts) {
    detail(
      "Debt payments",
      "Repaying money owed. Not counted as an expense or revenue.",
      ["Date", "Debt", "Notes", "Payment"],
      rows.debtPayments,
      (r) => [displayDate(r.date), r.debt, r.notes, right(pesoText(r.amountCents))],
      [sumLabel(3, "Total debt payments"), right(pesoText(totals.debtPaymentsCents))],
      { 0: { cellWidth: 24 }, 1: { cellWidth: 50 }, 2: { cellWidth: "auto" }, 3: { cellWidth: 28, halign: "right" } },
    );
    detail(
      "Debts opened",
      "Money owed. Not counted as revenue or expense.",
      ["Date", "Debt", "Description", "Original amount"],
      rows.debtsOpened,
      (r) => [displayDate(r.date), r.debt, r.description, right(pesoText(r.originalCents))],
      [sumLabel(3, "Total debts opened"), right(pesoText(totals.debtsOpenedCents))],
      { 0: { cellWidth: 24 }, 1: { cellWidth: 50 }, 2: { cellWidth: "auto" }, 3: { cellWidth: 32, halign: "right" } },
    );
  }
  if (included.adjustments) {
    detail(
      "Monthly adjustments",
      "Shown separately. Not part of net income.",
      ["Date", "Type", "Description", "Amount"],
      rows.adjustments,
      (r) => [displayDate(r.date), adjustmentTypeLabel(r.type), r.notes ? `${r.description}\n${r.notes}` : r.description, right(pesoText(r.amountCents))],
      [sumLabel(3, "Total adjustments"), right(pesoText(totals.adjustmentsCents))],
      { 0: { cellWidth: 24 }, 1: { cellWidth: 32 }, 2: { cellWidth: "auto" }, 3: { cellWidth: 28, halign: "right" } },
    );
  }

  // ── footer on every page ──
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont(FONT, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text(`Financial Report · ${report.periodLabel}`, MARGIN, pageHeight - 8);
    doc.text(`Page ${page} of ${pages}`, pageWidth - MARGIN, pageHeight - 8, { align: "right" });
  }

  return Buffer.from(doc.output("arraybuffer"));
}
