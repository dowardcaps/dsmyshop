import { Check } from "lucide-react";

import { DailyTargetChart } from "@/components/performance/charts";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatPeso } from "@/lib/format";
import { parseDateInput } from "@/lib/dates";
import { progressToward } from "@/lib/performance/calc";
import type { PerformanceData } from "@/lib/performance/queries";
import { cn } from "@/lib/utils";

const peso = (cents: number) => formatPeso(cents / 100);

function Progress({
  pct,
  label,
  className,
}: {
  pct: number;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(100, Math.round(pct))}
      className="h-4 w-full overflow-hidden rounded-full bg-muted"
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-[width]",
          className,
        )}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

/** Where today's sales stand against the minimum, daily and growth targets, in plain words. */
function levelOf(sales: number, s: PerformanceData["settings"]): string {
  if (s.growthTargetCents > 0 && sales >= s.growthTargetCents)
    return "Growth target reached";
  if (sales >= s.dailyTargetCents) return "Daily target reached";
  if (sales >= s.minDailyTargetCents) return "Minimum reached";
  return "Below minimum";
}

export function SimpleOverview({ data }: { data: PerformanceData }) {
  const { settings, focus, monthlyTarget, days } = data;
  const sales = focus?.row.salesCents ?? 0;
  const day = progressToward(sales, settings.dailyTargetCents);
  const month = progressToward(
    data.monthTotals.salesCents,
    monthlyTarget.monthlyTargetCents,
  );
  const sellingDays = days.filter((d) => d.operating);
  const hitDays = sellingDays.filter(
    (d) => d.salesCents >= settings.dailyTargetCents,
  ).length;
  const dayLabel = focus
    ? focus.isToday
      ? "Today"
      : `Last sales day · ${formatDate(parseDateInput(focus.date))}`
    : "Today";
  const daysLeft = Math.max(0, settings.operatingDays - data.operatingDaysDone);

  return (
    <div className="space-y-4" data-testid="simple-overview">
      <Card data-testid="simple-day">
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm text-muted-foreground">{dayLabel}</p>
              <p
                className="text-4xl font-semibold tabular-nums"
                data-testid="simple-day-sales"
              >
                {peso(sales)}
              </p>
              <p className="text-sm text-muted-foreground">
                Target {peso(settings.dailyTargetCents)}
              </p>
            </div>
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium",
                day.achieved
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground",
              )}
              data-testid="simple-day-status"
            >
              {day.achieved ? <Check className="size-4" aria-hidden /> : null}
              {day.achieved
                ? "Target hit"
                : `${peso(day.remainingCents)} to go`}
            </div>
          </div>
          <Progress
            pct={day.pct}
            label="Daily target progress"
            className={day.achieved ? "bg-emerald-500" : undefined}
          />
          <p className="text-xs text-muted-foreground">
            {levelOf(sales, settings)} · Minimum{" "}
            {peso(settings.minDailyTargetCents)} · Growth{" "}
            {peso(settings.growthTargetCents)}
          </p>
        </CardContent>
      </Card>

      <Card data-testid="simple-month">
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm text-muted-foreground">This month</p>
              <p className="text-3xl font-semibold tabular-nums">
                {peso(data.monthTotals.salesCents)}
              </p>
              <p className="text-sm text-muted-foreground">
                Target {peso(monthlyTarget.monthlyTargetCents)} (
                {settings.operatingDays} days ×{" "}
                {peso(settings.dailyTargetCents)})
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-medium" data-testid="simple-days-hit">
                {hitDays} of {sellingDays.length} selling{" "}
                {sellingDays.length === 1 ? "day" : "days"} hit the target
              </p>
            </div>
          </div>
          <Progress
            pct={month.pct}
            label="Monthly target progress"
            className={month.achieved ? "bg-emerald-500" : "bg-violet-500"}
          />
          <p
            className="text-xs text-muted-foreground"
            data-testid="simple-required"
          >
            {month.achieved
              ? "Monthly target reached."
              : data.isCurrentMonth && monthlyTarget.requiredDailyCents !== null
                ? `Needs about ${peso(monthlyTarget.requiredDailyCents)} a day for the remaining ${daysLeft} days.`
                : `${peso(monthlyTarget.remainingCents)} short of the monthly target.`}
          </p>
        </CardContent>
      </Card>

      <DailyTargetChart
        days={days.map((d) => ({
          label: d.date.slice(8),
          sales: d.salesCents / 100,
        }))}
        dailyTarget={settings.dailyTargetCents / 100}
      />
    </div>
  );
}
