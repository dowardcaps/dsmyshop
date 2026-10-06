import { DEFAULT_TIMEZONE } from "@/lib/format";

/** "2026-09-01" -> Date at UTC midnight (matches a PostgreSQL DATE column). */
export function parseDateInput(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Date from a DATE column -> "2026-09-01" for <input type="date">. */
export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Today's calendar date in Asia/Manila as "YYYY-MM-DD". */
export function todayInManila(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: DEFAULT_TIMEZONE }).format(new Date());
}

/** True for a real calendar date written as YYYY-MM-DD. */
export function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parseDateInput(value);
  return !Number.isNaN(date.getTime()) && toDateInputValue(date) === value;
}
