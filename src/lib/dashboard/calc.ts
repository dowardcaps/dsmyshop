/**
 * Dashboard calculations. The net income formula itself lives in `@/lib/finance/components`
 * (Sales.xlsx rules). This file only shapes data for the charts.
 */

import { emptyComponents, netIncomeOf, type CashComponents } from "@/lib/finance/components";

export interface MonthlyPoint {
  /** 1..12 */
  month: number;
  salesCents: number;
  gcashChargesCents: number;
  expensesCents: number;
  excessCents: number;
  reimbursementsCents: number;
  salaryPaidCents: number;
  shortCents: number;
  netIncomeCents: number;
}

/** Combines sparse per-month components ("2026-07" -> components) into a full 12-month series. */
export function buildMonthlySeries(year: number, byMonth: ReadonlyMap<string, CashComponents>): MonthlyPoint[] {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const c = byMonth.get(`${year}-${String(month).padStart(2, "0")}`) ?? emptyComponents();
    return {
      month,
      salesCents: c.salesCents,
      gcashChargesCents: c.gcashChargesCents,
      expensesCents: c.expensesCents,
      excessCents: c.excessCents,
      reimbursementsCents: c.reimbursementsCents,
      salaryPaidCents: c.salaryPaidCents,
      shortCents: c.shortCents,
      netIncomeCents: netIncomeOf(c),
    };
  });
}

export interface CategorySlice {
  name: string;
  cents: number;
}

/** Keeps the biggest `max` categories and folds the rest into "Other categories". */
export function topCategories(slices: readonly CategorySlice[], max = 6): CategorySlice[] {
  const sorted = slices.filter((s) => s.cents > 0).sort((a, b) => b.cents - a.cents);
  if (sorted.length <= max) return sorted;
  const head = sorted.slice(0, max - 1);
  const rest = sorted.slice(max - 1).reduce((sum, s) => sum + s.cents, 0);
  return [...head, { name: "Other categories", cents: rest }];
}
