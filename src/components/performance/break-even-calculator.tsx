"use client";

import { useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPeso } from "@/lib/format";
import { breakEven } from "@/lib/performance/calc";
import { toCents } from "@/lib/cents";

export interface BreakEvenDefaults {
  /** Pesos. */
  monthlyFixed: number;
  operatingDays: number;
  averageDailySales: number;
  variableCostPct: number;
  dailyTarget: number;
  /** Where the variable cost % came from. */
  variableSource: string;
}

const num = (value: string): number => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const peso = (cents: number | null) =>
  cents === null ? "n/a" : formatPeso(cents / 100);

/** Live calculator. Starts from your saved numbers; changing the boxes here never changes your records or settings. */
export function BreakEvenCalculator({
  defaults,
}: {
  defaults: BreakEvenDefaults;
}) {
  const [fixed, setFixed] = useState(String(defaults.monthlyFixed));
  const [days, setDays] = useState(String(defaults.operatingDays));
  const [avg, setAvg] = useState(
    String(Math.round(defaults.averageDailySales * 100) / 100),
  );
  const [pct, setPct] = useState(
    String(Math.round(defaults.variableCostPct * 100) / 100),
  );
  const [target, setTarget] = useState(String(defaults.dailyTarget));

  const result = useMemo(
    () =>
      breakEven({
        monthlyFixedCents: toCents(num(fixed)),
        operatingDays: Math.max(1, Math.round(num(days))),
        variableCostPct: Math.min(num(pct), 100),
        dailyTargetCents: toCents(num(target)),
      }),
    [fixed, days, pct, target],
  );
  const avgCents = toCents(num(avg));
  const dailyProfit =
    avgCents * result.contributionMargin - result.dailyFixedCents;
  const monthlyProfit =
    Math.round(dailyProfit) * Math.max(1, Math.round(num(days)));

  const field = (
    id: string,
    label: string,
    value: string,
    set: (v: string) => void,
    step = "0.01",
    hint?: string,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={value}
        onChange={(e) => set(e.target.value)}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2" data-testid="breakeven">
      <Card>
        <CardHeader>
          <CardTitle>Assumptions</CardTitle>
          <CardDescription>
            Change any box to try a what-if. Your saved settings stay as they
            are.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {field("be-fixed", "Monthly fixed expenses (₱)", fixed, setFixed)}
          {field("be-days", "Operating days per month", days, setDays, "1")}
          {field(
            "be-avg",
            "Average daily sales (₱)",
            avg,
            setAvg,
            "0.01",
            "Default: this month's sales ÷ days with sales.",
          )}
          {field(
            "be-pct",
            "Average variable cost (% of sales)",
            pct,
            setPct,
            "0.1",
            `Materials and other costs. ${defaults.variableSource}`,
          )}
          {field("be-target", "Daily sales target (₱)", target, setTarget)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Result</CardTitle>
          <CardDescription>
            Contribution margin = 100% − variable cost % ={" "}
            {(result.contributionMargin * 100).toFixed(1)}%
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Fixed cost per day</dt>
              <dd
                className="text-lg font-semibold tabular-nums"
                data-testid="be-daily-fixed"
              >
                {peso(result.dailyFixedCents)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                Break-even, fixed costs only
              </dt>
              <dd
                className="text-lg font-semibold tabular-nums"
                data-testid="be-fixed-only"
              >
                {peso(result.dailyFixedBreakEvenCents)}
              </dd>
              <dd className="text-xs text-muted-foreground">
                Assumes no material or other costs.
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Full break-even per day</dt>
              <dd
                className="text-lg font-semibold tabular-nums"
                data-testid="be-full-daily"
              >
                {peso(result.dailyBreakEvenCents)}
              </dd>
              <dd className="text-xs text-muted-foreground">
                Fixed ÷ contribution margin.
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                Full break-even per month
              </dt>
              <dd
                className="text-lg font-semibold tabular-nums"
                data-testid="be-full-monthly"
              >
                {peso(result.monthlyBreakEvenCents)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                Daily target vs full break-even
              </dt>
              <dd
                className={`text-lg font-semibold tabular-nums ${result.dailyTargetGapCents !== null && result.dailyTargetGapCents < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}
                data-testid="be-gap"
              >
                {result.dailyTargetGapCents === null
                  ? "n/a"
                  : `${result.dailyTargetGapCents >= 0 ? "+" : "−"}${peso(Math.abs(result.dailyTargetGapCents))}`}
              </dd>
              <dd className="text-xs text-muted-foreground">
                {result.dailyTargetGapCents === null
                  ? ""
                  : result.dailyTargetGapCents >= 0
                    ? "The target leaves room for profit."
                    : "The target does not cover costs."}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                Expected profit at average sales
              </dt>
              <dd
                className={`text-lg font-semibold tabular-nums ${dailyProfit < 0 ? "text-destructive" : ""}`}
                data-testid="be-profit"
              >
                {dailyProfit < 0 ? "−" : ""}
                {peso(Math.abs(Math.round(dailyProfit)))} / day
              </dd>
              <dd className="text-xs text-muted-foreground">
                ≈ {monthlyProfit < 0 ? "−" : ""}
                {peso(Math.abs(monthlyProfit))} a month
              </dd>
            </div>
          </dl>
          <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            Fixed-cost break-even (₱
            {(result.dailyFixedBreakEvenCents / 100).toFixed(2)}) is the minimum
            before materials. Because each peso of sales also uses {pct || 0}%
            for materials and other costs, the sales you really need are higher:
            the full break-even. Gross sales are not profit.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
