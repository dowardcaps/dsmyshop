/** Pure logic for the Calendar sales graph: one point per day, a 7-day average, and "up or down" numbers. */

import {
  datesBetween,
  daysInMonth,
  monthEnd,
  monthStart,
} from "@/lib/calendar/grid";

/** What one day brought in. A subset of DailyIncome so this file stays free of server code. */
export interface DayAmounts {
  salesCents: number;
  totalCents: number;
}

export type TrendMeasure = "sales" | "earnings";

export interface TrendPoint {
  date: string;
  day: number;
  salesCents: number;
  earningsCents: number;
  /** Average of this day and up to 6 days before it. Smooths out slow and busy days so the direction is easy to see. */
  salesAvgCents: number;
  earningsAvgCents: number;
}

export const MOVING_AVERAGE_DAYS = 7;
/** Changes smaller than this (in percent) are shown as "about the same". */
export const FLAT_PERCENT = 2;

/** The last day of the month that should be plotted: today for the current month, the whole month for the past, nothing for the future. */
export function lastPlottedDate(month: string, today: string): string | null {
  const todayMonth = today.slice(0, 7);
  if (month > todayMonth) return null;
  return month === todayMonth ? today : monthEnd(month);
}

function trailingAverage(values: number[], index: number): number {
  const from = Math.max(0, index - MOVING_AVERAGE_DAYS + 1);
  const slice = values.slice(from, index + 1);
  return Math.round(slice.reduce((sum, v) => sum + v, 0) / slice.length);
}

/** One point for every day from the 1st up to the last plotted day. Days with no money are 0, so a slow day shows as a dip. */
export function buildTrend(
  month: string,
  income: ReadonlyMap<string, DayAmounts>,
  today: string,
): TrendPoint[] {
  const last = lastPlottedDate(month, today);
  if (!last) return [];
  const dates = datesBetween(monthStart(month), last);
  const sales = dates.map((date) => income.get(date)?.salesCents ?? 0);
  const earnings = dates.map((date) => income.get(date)?.totalCents ?? 0);
  return dates.map((date, i) => ({
    date,
    day: Number(date.slice(8, 10)),
    salesCents: sales[i],
    earningsCents: earnings[i],
    salesAvgCents: trailingAverage(sales, i),
    earningsAvgCents: trailingAverage(earnings, i),
  }));
}

export type Direction = "up" | "down" | "same";

export interface TrendSummary {
  totalCents: number;
  /** Average per plotted day (closed days count as 0). */
  dailyAverageCents: number;
  best: { date: string; cents: number } | null;
  /** Same number of days of the month before. */
  previousCents: number;
  /** Percent change against `previousCents`; null when there is nothing to compare with. */
  changePercent: number | null;
  direction: Direction | null;
}

export function directionOf(changePercent: number | null): Direction | null {
  if (changePercent === null) return null;
  if (Math.abs(changePercent) < FLAT_PERCENT) return "same";
  return changePercent > 0 ? "up" : "down";
}

/** Total of the first `days` days of `month` (days past the end of that month are ignored). */
export function sumFirstDays(
  income: ReadonlyMap<string, DayAmounts>,
  month: string,
  days: number,
  measure: TrendMeasure,
): number {
  const count = Math.min(days, daysInMonth(month));
  if (count <= 0) return 0;
  let total = 0;
  for (const date of datesBetween(
    monthStart(month),
    `${month}-${String(count).padStart(2, "0")}`,
  )) {
    const entry = income.get(date);
    total +=
      measure === "sales" ? (entry?.salesCents ?? 0) : (entry?.totalCents ?? 0);
  }
  return total;
}

export function summarize(
  points: TrendPoint[],
  measure: TrendMeasure,
  previousIncome: ReadonlyMap<string, DayAmounts>,
  previousMonth: string,
): TrendSummary {
  const pick = (p: TrendPoint) =>
    measure === "sales" ? p.salesCents : p.earningsCents;
  const totalCents = points.reduce((sum, p) => sum + pick(p), 0);
  const best = points.reduce<TrendSummary["best"]>(
    (top, p) =>
      pick(p) > (top?.cents ?? 0) ? { date: p.date, cents: pick(p) } : top,
    null,
  );
  const previousCents = sumFirstDays(
    previousIncome,
    previousMonth,
    points.length,
    measure,
  );
  const changePercent =
    points.length > 0 && previousCents > 0
      ? ((totalCents - previousCents) / previousCents) * 100
      : null;
  return {
    totalCents,
    dailyAverageCents:
      points.length > 0 ? Math.round(totalCents / points.length) : 0,
    best,
    previousCents,
    changePercent,
    direction: directionOf(changePercent),
  };
}
