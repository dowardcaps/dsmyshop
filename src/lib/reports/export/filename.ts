import type { Report, ReportExportFormat, ReportType } from "@/lib/reports/types";
import { REPORT_TYPES } from "@/lib/reports/types";

const TYPE_FILE_LABELS: Record<ReportType, string> = {
  sales: "Sales",
  gcash: "GCash",
  expenses: "Expenses",
  debts: "Debts",
  adjustments: "Adjustments",
};

/**
 * "Financial_Report_February_March_2026.xlsx"
 * CSV/PDF of a partial selection adds the types: "Financial_Report_Sales_Expenses_February_2026.csv"
 */
export function reportFileName(report: Report, format: ReportExportFormat): string {
  const partial = report.selection.types.length < REPORT_TYPES.length;
  const types = partial ? `${report.selection.types.map((type) => TYPE_FILE_LABELS[type]).join("_")}_` : "";
  return `Financial_Report_${types}${report.fileLabel}.${format}`.replace(/[^A-Za-z0-9._-]/g, "_");
}
