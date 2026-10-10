/**
 * Dashboard formulas (all money in integer centavos).
 *
 * Revenue    = sales + GCash charges (the fees we earn)
 * Net income = revenue + excess money - expenses - reimbursements
 * Excess money (cash overage) is not revenue, but it is added to net income.
 * NOT revenue: GCash Cash In / Cash Out / Load amounts (cash movements), and
 *              adjustments (salary, reimbursements, other income), which are shown separately.
 */

export function revenueCents(salesCents: number, gcashChargesCents: number): number {
  return salesCents + gcashChargesCents;
}

export function netIncomeCents(salesCents: number, gcashChargesCents: number, expensesCents: number, excessCents = 0, reimbursementsCents = 0): number {
  return revenueCents(salesCents, gcashChargesCents) + excessCents - expensesCents - reimbursementsCents;
}

export interface MonthlyPoint {
  /** 1..12 */
  month: number;
  salesCents: number;
  gcashChargesCents: number;
  expensesCents: number;
  excessCents: number;
  reimbursementsCents: number;
  netIncomeCents: number;
}

/** Combines sparse per-month totals into a full 12-month series (missing months = 0). */
export function buildMonthlySeries(
  sales: ReadonlyMap<number, number>,
  charges: ReadonlyMap<number, number>,
  expenses: ReadonlyMap<number, number>,
  excess: ReadonlyMap<number, number> = new Map(),
  reimbursements: ReadonlyMap<number, number> = new Map(),
): MonthlyPoint[] {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const salesCents = sales.get(month) ?? 0;
    const gcashChargesCents = charges.get(month) ?? 0;
    const expensesCents = expenses.get(month) ?? 0;
    const excessCents = excess.get(month) ?? 0;
    const reimbursementsCents = reimbursements.get(month) ?? 0;
    return {
      month,
      salesCents,
      gcashChargesCents,
      expensesCents,
      excessCents,
      reimbursementsCents,
      netIncomeCents: netIncomeCents(salesCents, gcashChargesCents, expensesCents, excessCents, reimbursementsCents),
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
