/** Pure calendar maths. Dates are "YYYY-MM-DD" strings and months "YYYY-MM"; everything is computed in UTC so no timezone can shift a day. */

import { isValidDateInput, todayInManila } from "@/lib/dates";

const pad = (n: number) => String(n).padStart(2, "0");

export const WEEKDAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export interface GridCell {
  date: string;
  day: number;
  inMonth: boolean;
}

export function isValidMonth(value: string | undefined): value is string {
  return !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** The month from the URL, or the current month when missing or invalid. */
export function parseMonthParam(value: string | undefined): string {
  return isValidMonth(value) ? value : todayInManila().slice(0, 7);
}

export function parseDayParam(value: string | undefined): string | undefined {
  return value && isValidDateInput(value) ? value : undefined;
}

export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

export function monthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, m - 1, 1)));
}

export function dayLabel(date: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function daysInMonth(month: string): number {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m, 0)).getUTCDate();
}

export const monthStart = (month: string) => `${month}-01`;
export const monthEnd = (month: string) =>
  `${month}-${pad(daysInMonth(month))}`;

/** Weeks (Sunday first) covering the month; days from the neighbouring months fill the first and last week. */
export function buildMonthGrid(month: string): GridCell[][] {
  const [year, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, m - 1, 1));
  const start = new Date(first);
  start.setUTCDate(1 - first.getUTCDay());
  const weeks: GridCell[][] = [];
  const cursor = new Date(start);
  do {
    const week: GridCell[] = [];
    for (let i = 0; i < 7; i += 1) {
      const date = `${cursor.getUTCFullYear()}-${pad(cursor.getUTCMonth() + 1)}-${pad(cursor.getUTCDate())}`;
      week.push({
        date,
        day: cursor.getUTCDate(),
        inMonth: date.startsWith(month),
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(week);
  } while (cursor.getUTCMonth() === m - 1 && cursor.getUTCFullYear() === year);
  return weeks;
}

/** Every date from `from` to `to`, inclusive. */
export function datesBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end && dates.length < 400) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}
