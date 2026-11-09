/** Run with: npx tsx src/lib/performance/calc.test.ts */
import assert from "node:assert/strict";

import {
  breakEven,
  dailyFixedCents,
  monthlyTargetProgress,
  percentChange,
  profitOf,
  progressToward,
  targetStatus,
  variableCostPctOf,
} from "./calc";

const peso = (n: number) => Math.round(n * 100);

// Reference scenario from the spec: ₱13,300 fixed over 26 days.
assert.equal(
  dailyFixedCents(peso(13300), 26),
  51154,
  "daily fixed cost 511.54",
);
const day = profitOf({
  grossSalesCents: peso(1000),
  materialCents: peso(250),
  otherExpensesCents: peso(50),
  fixedCostCents: dailyFixedCents(peso(13300), 26),
});
assert.equal(day.grossProfitCents, peso(750));
assert.equal(day.netProfitCents, 18846, "daily net profit 188.46");
const month = profitOf({
  grossSalesCents: peso(26000),
  materialCents: peso(6500),
  otherExpensesCents: peso(1300),
  fixedCostCents: peso(13300),
});
assert.equal(month.netProfitCents, peso(4900), "monthly net profit 4,900");
assert.equal(Math.round(month.marginPct! * 100) / 100, 18.85);

// Break-even: fixed only, then with 25% materials + 5% other (30% variable).
const fixedOnly = breakEven({
  monthlyFixedCents: peso(13300),
  operatingDays: 26,
  variableCostPct: 0,
  dailyTargetCents: peso(1000),
});
assert.equal(fixedOnly.dailyBreakEvenCents, 51154);
assert.equal(fixedOnly.dailyTargetGapCents, peso(1000) - 51154);
const full = breakEven({
  monthlyFixedCents: peso(13300),
  operatingDays: 26,
  variableCostPct: 30,
  dailyTargetCents: peso(1000),
});
assert.equal(full.dailyBreakEvenCents, Math.round(51154 / 0.7));
assert.equal(full.monthlyBreakEvenCents, Math.round(1330000 / 0.7));
assert.equal(
  breakEven({
    monthlyFixedCents: peso(13300),
    operatingDays: 26,
    variableCostPct: 100,
    dailyTargetCents: 1,
  }).dailyBreakEvenCents,
  null,
);

// Targets.
const t = {
  breakEvenCents: 51154,
  minTargetCents: peso(600),
  dailyTargetCents: peso(1000),
  growthTargetCents: peso(1500),
};
assert.equal(targetStatus({ ...t, salesCents: 0 }), "BELOW_BREAK_EVEN");
assert.equal(targetStatus({ ...t, salesCents: peso(520) }), "BREAK_EVEN");
assert.equal(targetStatus({ ...t, salesCents: peso(700) }), "IN_PROGRESS");
assert.equal(targetStatus({ ...t, salesCents: peso(1000) }), "TARGET");
assert.equal(targetStatus({ ...t, salesCents: peso(1500) }), "GROWTH");
const p = progressToward(peso(250), peso(1000));
assert.deepEqual([p.pct, p.remainingCents, p.achieved], [25, peso(750), false]);
const m = monthlyTargetProgress({
  salesToDateCents: peso(10000),
  dailyTargetCents: peso(1000),
  operatingDays: 26,
  operatingDaysLeft: 16,
});
assert.equal(m.monthlyTargetCents, peso(26000));
assert.equal(m.requiredDailyCents, peso(1000));
assert.equal(
  monthlyTargetProgress({
    salesToDateCents: 0,
    dailyTargetCents: 100,
    operatingDays: 26,
    operatingDaysLeft: 0,
  }).requiredDailyCents,
  null,
);

// Empty / zero data.
const empty = profitOf({
  grossSalesCents: 0,
  materialCents: 0,
  otherExpensesCents: 0,
  fixedCostCents: 0,
});
assert.equal(empty.netProfitCents, 0);
assert.equal(empty.marginPct, null);
assert.equal(variableCostPctOf(0, 0, 0), null);
assert.equal(variableCostPctOf(peso(1000), peso(250), peso(50)), 30);
assert.equal(percentChange(10, 0), null);
assert.equal(percentChange(150, 100), 50);
assert.equal(dailyFixedCents(1000, 0), 0);
console.log("performance calc: all checks passed");
