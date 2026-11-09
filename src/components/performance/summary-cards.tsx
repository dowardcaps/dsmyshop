import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatPeso } from "@/lib/format";
import { TARGET_STATUS_LABEL, progressToward } from "@/lib/performance/calc";
import { parseDateInput } from "@/lib/dates";
import type { PerformanceData } from "@/lib/performance/queries";
import { cn } from "@/lib/utils";

const peso = (cents: number) => formatPeso(cents / 100);
const tone = (cents: number) =>
  cents > 0
    ? "text-emerald-600 dark:text-emerald-400"
    : cents < 0
      ? "text-destructive"
      : "text-foreground";

/** Percent change vs the previous month. For costs, `goodWhenDown` flips the colours. */
function Change({
  value,
  goodWhenDown = false,
}: {
  value: number | null;
  goodWhenDown?: boolean;
}) {
  if (value === null)
    return (
      <span className="text-xs text-muted-foreground">
        No earlier month to compare
      </span>
    );
  const up = value > 0.05;
  const down = value < -0.05;
  const good = goodWhenDown ? down : up;
  const bad = goodWhenDown ? up : down;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        good
          ? "text-emerald-600 dark:text-emerald-400"
          : bad
            ? "text-destructive"
            : "text-muted-foreground",
      )}
    >
      <Icon className="size-3.5" aria-hidden /> {Math.abs(value).toFixed(1)}% vs
      last month
    </span>
  );
}

function Stat({
  label,
  value,
  valueClass,
  children,
  testId,
}: {
  label: string;
  value: string;
  valueClass?: string;
  children?: React.ReactNode;
  testId: string;
}) {
  return (
    <Card className="gap-1 py-4" data-testid={testId}>
      <CardContent>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p
          className={cn("mt-1 text-2xl font-semibold tabular-nums", valueClass)}
        >
          {value}
        </p>
        {children ? (
          <div className="mt-1 text-xs text-muted-foreground">{children}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PerformanceSummary({ data }: { data: PerformanceData }) {
  const { focus, monthTotals: m, settings } = data;
  const dayLabel = focus
    ? focus.isToday
      ? "Today"
      : formatDate(parseDateInput(focus.date))
    : "Today";
  const day = focus?.row;
  const progress = progressToward(
    day?.salesCents ?? 0,
    settings.dailyTargetCents,
  );
  const monthlyExpenses = m.materialCents + m.otherCents + m.fixedCents;
  const beMonthly = data.breakEven.monthlyBreakEvenCents;
  const beReached = beMonthly !== null && m.salesCents >= beMonthly;

  return (
    <section aria-label="Summary" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          testId="perf-day-sales"
          label={`${dayLabel}'s gross sales`}
          value={peso(day?.salesCents ?? 0)}
        >
          {focus ? null : "No sales recorded this month yet"}
        </Stat>
        <Stat
          testId="perf-day-material"
          label={`${dayLabel}'s material costs`}
          value={peso(day?.materialCents ?? 0)}
        />
        <Stat
          testId="perf-day-other"
          label={`${dayLabel}'s other expenses`}
          value={peso(day?.otherCents ?? 0)}
        />
        <Stat
          testId="perf-day-net"
          label={`${dayLabel}'s net profit`}
          value={peso(day?.profit.netProfitCents ?? 0)}
          valueClass={tone(day?.profit.netProfitCents ?? 0)}
        >
          After {peso(day?.profit.fixedCostCents ?? 0)} fixed-cost share
        </Stat>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat
          testId="perf-month-sales"
          label="Monthly gross sales"
          value={peso(m.salesCents)}
        >
          <Change value={data.changes.sales} />
        </Stat>
        <Stat
          testId="perf-month-expenses"
          label="Monthly total expenses"
          value={peso(monthlyExpenses)}
        >
          <Change value={data.changes.expenses} goodWhenDown />
        </Stat>
        <Stat
          testId="perf-month-net"
          label="Monthly net profit"
          value={peso(m.profit.netProfitCents)}
          valueClass={tone(m.profit.netProfitCents)}
        >
          <Change value={data.changes.net} />
        </Stat>
        <Stat
          testId="perf-target-progress"
          label="Daily sales target progress"
          value={`${Math.round(progress.pct)}%`}
        >
          {progress.achieved
            ? "Daily target reached"
            : `${peso(progress.remainingCents)} to go of ${peso(settings.dailyTargetCents)}`}
          {data.focusStatus ? (
            <span className="mt-1 block font-medium text-foreground">
              {TARGET_STATUS_LABEL[data.focusStatus]}
            </span>
          ) : null}
        </Stat>
        <Stat
          testId="perf-breakeven-status"
          label="Monthly break-even status"
          value={
            beMonthly === null
              ? "No break-even"
              : beReached
                ? "Reached"
                : "Not yet"
          }
          valueClass={
            beMonthly === null
              ? undefined
              : beReached
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
          }
        >
          {beMonthly === null
            ? "Variable costs are 100% of sales"
            : `${peso(m.salesCents)} of ${peso(beMonthly)} needed`}
        </Stat>
      </div>
    </section>
  );
}
