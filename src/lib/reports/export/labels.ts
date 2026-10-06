import { GCASH_PROVIDER_LABELS, GCASH_TYPE_LABELS, type GcashProviderValue, type GcashTransactionTypeValue } from "@/lib/gcash/constants";
import { formatDate } from "@/lib/format";

export const gcashTypeLabel = (type: string) => GCASH_TYPE_LABELS[type as GcashTransactionTypeValue] ?? type;
export const gcashProviderLabel = (provider: string) => GCASH_PROVIDER_LABELS[provider as GcashProviderValue] ?? provider;

const ADJUSTMENT_LABELS: Record<string, string> = {
  SALARY: "Salary",
  REIMBURSEMENT: "Reimbursement",
  OTHER_INCOME: "Other income",
  OTHER_ADJUSTMENT: "Other adjustment",
};
export const adjustmentTypeLabel = (type: string) => ADJUSTMENT_LABELS[type] ?? type;

/** "2026-09-01" -> "Sep 1, 2026" (DATE values carry no time zone). */
export function displayDate(date: string): string {
  return formatDate(new Date(`${date}T00:00:00.000Z`), { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

/** "2026-09-01" -> a Date at UTC midnight, for Excel date cells. */
export const excelDate = (date: string) => new Date(`${date}T00:00:00.000Z`);

/** Plain money text for PDF/CSV-free contexts: 1234.5 -> "₱1,234.50". */
export function pesoText(cents: number): string {
  const sign = cents < 0 ? "−" : "";
  const abs = Math.abs(cents) / 100;
  return `${sign}₱${abs.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generatedAtText(): string {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date());
}
