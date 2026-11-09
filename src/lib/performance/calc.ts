/**
 * Business Performance formulas. Pure functions, all money in integer centavos, so there is no floating-point drift.
 * Nothing here is hard-coded to DS Prints: every assumption (fixed costs, operating days, targets) is an argument.
 *
 * Accounting basis (accrual-style, different from the cash-basis Net income on the Dashboard):
 *   Gross profit = Gross sales - Material costs
 *   Net profit   = Gross profit - Fixed cost allocation - Other expenses
 * Fixed costs (rent, salaries, internet...) are spread over the operating days, and counted ONCE per month.
 */

const ratio = (part: number, whole: number): number | null =>
  whole > 0 ? part / whole : null;

/** Cents rounded to the nearest centavo (half away from zero is fine: values are not negative here). */
const round = (value: number): number => Math.round(value);

/** Fixed cost of one operating day. ₱13,300 / 26 = ₱511.54. */
export function dailyFixedCents(
  monthlyFixedCents: number,
  operatingDays: number,
): number {
  return operatingDays > 0 ? round(monthlyFixedCents / operatingDays) : 0;
}

export interface ProfitInput {
  grossSalesCents: number;
  materialCents: number;
  otherExpensesCents: number;
  /** Fixed cost charged to this period: the daily allocation for a day, the whole month's fixed cost for a month. */
  fixedCostCents: number;
}

export interface ProfitResult extends ProfitInput {
  grossProfitCents: number;
  netProfitCents: number;
  /** Net profit / gross sales, or null when there were no sales. */
  marginPct: number | null;
}

export function profitOf(input: ProfitInput): ProfitResult {
  const grossProfitCents = input.grossSalesCents - input.materialCents;
  const netProfitCents =
    grossProfitCents - input.fixedCostCents - input.otherExpensesCents;
  const margin = ratio(netProfitCents, input.grossSalesCents);
  return {
    ...input,
    grossProfitCents,
    netProfitCents,
    marginPct: margin === null ? null : margin * 100,
  };
}

export interface BreakEvenInput {
  monthlyFixedCents: number;
  operatingDays: number;
  /** Share of each peso of sales spent on materials and other variable costs, 0..100. */
  variableCostPct: number;
  dailyTargetCents: number;
}

export interface BreakEvenResult {
  dailyFixedCents: number;
  /** 1 - variable cost share. The part of each peso of sales left to pay fixed costs. */
  contributionMargin: number;
  /** Sales per day to cover fixed costs only (assumes no variable cost). */
  dailyFixedBreakEvenCents: number;
  /** Sales per day to cover fixed AND variable costs. Null when variable costs are 100% or more of sales. */
  dailyBreakEvenCents: number | null;
  monthlyBreakEvenCents: number | null;
  /** target - break-even. Positive = the target leaves room for profit. */
  dailyTargetGapCents: number | null;
}

export function breakEven(input: BreakEvenInput): BreakEvenResult {
  const fixedPerDay = dailyFixedCents(
    input.monthlyFixedCents,
    input.operatingDays,
  );
  const margin = 1 - Math.min(Math.max(input.variableCostPct, 0), 100) / 100;
  const full = margin > 0;
  const daily = full ? round(fixedPerDay / margin) : null;
  return {
    dailyFixedCents: fixedPerDay,
    contributionMargin: margin,
    dailyFixedBreakEvenCents: fixedPerDay,
    dailyBreakEvenCents: daily,
    monthlyBreakEvenCents: full
      ? round(input.monthlyFixedCents / margin)
      : null,
    dailyTargetGapCents: daily === null ? null : input.dailyTargetCents - daily,
  };
}

export type TargetStatus =
  "BELOW_BREAK_EVEN" | "BREAK_EVEN" | "IN_PROGRESS" | "TARGET" | "GROWTH";

export const TARGET_STATUS_LABEL: Record<TargetStatus, string> = {
  BELOW_BREAK_EVEN: "Below Break-Even",
  BREAK_EVEN: "Break-Even Reached",
  IN_PROGRESS: "Target In Progress",
  TARGET: "Target Achieved",
  GROWTH: "Growth Target Achieved",
};

export interface TargetInput {
  salesCents: number;
  breakEvenCents: number;
  minTargetCents: number;
  dailyTargetCents: number;
  growthTargetCents: number;
}

/**
 * Below Break-Even  : sales < break-even
 * Break-Even Reached: break-even <= sales < minimum target
 * Target In Progress: minimum target <= sales < recommended target
 * Target Achieved   : recommended <= sales < growth target; Growth Target Achieved: sales >= growth target
 */
export function targetStatus(input: TargetInput): TargetStatus {
  const sales = input.salesCents;
  if (input.growthTargetCents > 0 && sales >= input.growthTargetCents)
    return "GROWTH";
  if (input.dailyTargetCents > 0 && sales >= input.dailyTargetCents)
    return "TARGET";
  if (
    sales > 0 &&
    sales >= Math.max(input.minTargetCents, input.breakEvenCents)
  )
    return "IN_PROGRESS";
  if (sales > 0 && sales >= input.breakEvenCents) return "BREAK_EVEN";
  return "BELOW_BREAK_EVEN";
}

export interface TargetProgress {
  /** 0..100+ (capped at 999 for display). */
  pct: number;
  remainingCents: number;
  achieved: boolean;
}

export function progressToward(
  salesCents: number,
  targetCents: number,
): TargetProgress {
  const pct =
    targetCents > 0 ? Math.min(999, (salesCents / targetCents) * 100) : 0;
  return {
    pct,
    remainingCents: Math.max(0, targetCents - salesCents),
    achieved: targetCents > 0 && salesCents >= targetCents,
  };
}

export interface MonthlyTargetProgress {
  monthlyTargetCents: number;
  achievedPct: number;
  remainingCents: number;
  /** Average daily sales still needed on each remaining operating day, or null when no operating days are left. */
  requiredDailyCents: number | null;
}

export function monthlyTargetProgress(opts: {
  salesToDateCents: number;
  dailyTargetCents: number;
  operatingDays: number;
  operatingDaysLeft: number;
}): MonthlyTargetProgress {
  const monthlyTargetCents = opts.dailyTargetCents * opts.operatingDays;
  const remainingCents = Math.max(
    0,
    monthlyTargetCents - opts.salesToDateCents,
  );
  return {
    monthlyTargetCents,
    achievedPct:
      monthlyTargetCents > 0
        ? (opts.salesToDateCents / monthlyTargetCents) * 100
        : 0,
    remainingCents,
    requiredDailyCents:
      opts.operatingDaysLeft > 0
        ? round(remainingCents / opts.operatingDaysLeft)
        : null,
  };
}

/** Percentage change from `previous` to `current`, or null when there is nothing to compare with. */
export function percentChange(
  current: number,
  previous: number,
): number | null {
  return previous === 0
    ? null
    : ((current - previous) / Math.abs(previous)) * 100;
}

/** Variable cost share of sales (materials + other expenses), 0..100. Null with no sales. */
export function variableCostPctOf(
  salesCents: number,
  materialCents: number,
  otherCents: number,
): number | null {
  const r = ratio(materialCents + otherCents, salesCents);
  return r === null ? null : r * 100;
}
