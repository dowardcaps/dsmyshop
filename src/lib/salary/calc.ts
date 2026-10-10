/**
 * Salary rules (pure, all money in integer centavos).
 *
 *  - Monthly salary is split in two: the 15th and the 30th. An odd centavo goes to the 30th.
 *  - A cash advance is deducted from one pay date.
 *  - Remaining balance of a pay date = salary for that date - advances deducted from it.
 */

import { FIRST_PAY_DAY, SECOND_PAY_DAY } from "@/lib/salary/constants";

const pad = (n: number) => String(n).padStart(2, "0");

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** The two pay dates of a month as YYYY-MM-DD. The "30th" is the last day of a shorter month (February). */
export function payDatesForMonth(year: number, month: number): [string, string] {
  const second = Math.min(SECOND_PAY_DAY, daysInMonth(year, month));
  return [`${year}-${pad(month)}-${pad(FIRST_PAY_DAY)}`, `${year}-${pad(month)}-${pad(second)}`];
}

/** [first half, second half] of a monthly salary. They always add back up to the monthly salary. */
export function splitMonthlySalaryCents(monthlyCents: number): [number, number] {
  const first = Math.floor(monthlyCents / 2);
  return [first, monthlyCents - first];
}

/** Every "YYYY-MM" from the start month up to and including the end month. */
export function monthsBetween(startYearMonth: string, endYearMonth: string): string[] {
  const [sy, sm] = startYearMonth.split("-").map(Number);
  const [ey, em] = endYearMonth.split("-").map(Number);
  const months: string[] = [];
  for (let y = sy, m = sm; y < ey || (y === ey && m <= em); m === 12 ? ((y += 1), (m = 1)) : (m += 1)) {
    months.push(`${y}-${pad(m)}`);
    if (months.length > 600) break; // safety net: 50 years
  }
  return months;
}

export interface PlannedPeriod {
  payDate: string;
  grossCents: number;
}

/** The pay dates (with salary) an employee should have from their start month through the current month. */
export function plannedPeriods(monthlyCents: number, startYearMonth: string, currentYearMonth: string): PlannedPeriod[] {
  const [firstHalf, secondHalf] = splitMonthlySalaryCents(monthlyCents);
  return monthsBetween(startYearMonth, currentYearMonth).flatMap((ym) => {
    const [year, month] = ym.split("-").map(Number);
    const [first, second] = payDatesForMonth(year, month);
    return [
      { payDate: first, grossCents: firstHalf },
      { payDate: second, grossCents: secondHalf },
    ];
  });
}

export const remainingCents = (grossCents: number, advancesCents: number): number => grossCents - advancesCents;

/** The most that can still be advanced against a pay date. */
export const maxNewAdvanceCents = (grossCents: number, advancesCents: number): number => Math.max(0, remainingCents(grossCents, advancesCents));
