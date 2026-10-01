export const DEFAULT_TIMEZONE = "Asia/Manila";
export const DEFAULT_CURRENCY = "PHP";
const LOCALE = "en-PH";

const pesoFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: DEFAULT_CURRENCY,
});

/** Formats a number (or numeric string) as Philippine peso, e.g. ₱1,234.50 */
export function formatPeso(value: number | string): string {
  const amount = typeof value === "string" ? Number(value) : value;
  return pesoFormatter.format(Number.isFinite(amount) ? amount : 0);
}

/** Formats a date in the Asia/Manila timezone, e.g. "Sep 1, 2026" */
export function formatDate(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
): string {
  return new Intl.DateTimeFormat(LOCALE, {
    ...options,
    timeZone: DEFAULT_TIMEZONE,
  }).format(new Date(value));
}
