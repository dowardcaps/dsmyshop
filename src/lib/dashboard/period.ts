import { todayInManila } from "@/lib/dates";
import { firstParam, type RawSearchParams } from "@/lib/validation/filter-utils";

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const MONTH_SHORT = MONTH_NAMES.map((name) => name.slice(0, 3));

export const MIN_YEAR = 2000;
export const MAX_YEAR = 2100;

/** month = 1..12, or null for the whole year. */
export interface DashboardPeriod {
  year: number;
  month: number | null;
}

/** Pads a number to two digits. */
const pad = (value: number) => String(value).padStart(2, "0");

/** The current year and month in Asia/Manila. */
export function currentPeriod(): { year: number; month: number } {
  const [year, month] = todayInManila().split("-").map(Number);
  return { year, month };
}

/**
 * Reads ?year=2026&month=9 (month "all" = whole year).
 * Missing or invalid values fall back to the current month in Asia/Manila.
 */
export function parseDashboardPeriod(params: RawSearchParams): DashboardPeriod {
  const now = currentPeriod();

  const yearRaw = Number.parseInt(firstParam(params.year) ?? "", 10);
  const year = Number.isInteger(yearRaw) && yearRaw >= MIN_YEAR && yearRaw <= MAX_YEAR ? yearRaw : now.year;

  const monthRaw = firstParam(params.month);
  if (monthRaw === "all") return { year, month: null };

  const monthNumber = Number.parseInt(monthRaw ?? "", 10);
  if (Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
    return { year, month: monthNumber };
  }
  // A year with no month in the URL means "the current month of that year" only for the
  // current year; for other years the whole year is more useful.
  if (monthRaw === undefined && firstParam(params.year) && year !== now.year) return { year, month: null };
  return { year, month: now.month };
}

/** Inclusive date range as YYYY-MM-DD strings. */
export function periodRange(period: DashboardPeriod): { from: string; to: string } {
  if (period.month === null) return { from: `${period.year}-01-01`, to: `${period.year}-12-31` };
  const lastDay = new Date(Date.UTC(period.year, period.month, 0)).getUTCDate();
  return {
    from: `${period.year}-${pad(period.month)}-01`,
    to: `${period.year}-${pad(period.month)}-${pad(lastDay)}`,
  };
}

export function periodLabel(period: DashboardPeriod): string {
  return period.month === null ? `${period.year}` : `${MONTH_NAMES[period.month - 1]} ${period.year}`;
}

/** Years offered in the filter: from the earliest data year (or this year) to this year + 1. */
export function yearOptions(earliestYear: number | null, selectedYear: number): number[] {
  const thisYear = currentPeriod().year;
  const start = Math.min(earliestYear ?? thisYear, selectedYear, thisYear);
  const end = Math.max(thisYear, selectedYear);
  const years: number[] = [];
  for (let year = end; year >= start; year -= 1) years.push(year);
  return years;
}
