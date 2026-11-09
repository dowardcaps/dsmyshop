import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPeso } from "@/lib/format";
import { TARGET_STATUS_LABEL, progressToward } from "@/lib/performance/calc";
import type { PerformanceData } from "@/lib/performance/queries";
import { cn } from "@/lib/utils";

const peso = (cents: number) => formatPeso(cents / 100);

function Bar({
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
      className="h-3 w-full overflow-hidden rounded-full bg-muted"
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

export function TargetMonitor({ data }: { data: PerformanceData }) {
  const { settings, focus, monthlyTarget } = data;
  const sales = focus?.row.salesCents ?? 0;
  const day = progressToward(sales, settings.dailyTargetCents);
  const growth = progressToward(sales, settings.growthTargetCents);
  const monthly = progressToward(
    data.monthTotals.salesCents,
    monthlyTarget.monthlyTargetCents,
  );

  return (
    <Card data-testid="target-monitor">
      <CardHeader>
        <CardTitle>Sales targets</CardTitle>
        <CardDescription>
          {focus
            ? focus.isToday
              ? "Today"
              : `Last sales day, ${focus.date}`
            : "No sales this month yet"}{" "}
          · minimum {peso(settings.minDailyTargetCents)}, daily{" "}
          {peso(settings.dailyTargetCents)}, growth{" "}
          {peso(settings.growthTargetCents)}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium">Daily target</p>
            <p className="text-xs text-muted-foreground">
              {peso(sales)} of {peso(settings.dailyTargetCents)}
            </p>
          </div>
          <Bar
            pct={day.pct}
            label="Daily target progress"
            className={day.achieved ? "bg-emerald-500" : undefined}
          />
          <p
            className="text-xs text-muted-foreground"
            data-testid="target-remaining"
          >
            {day.achieved
              ? "Target achieved."
              : `${peso(day.remainingCents)} left to reach the target.`}
            {data.focusStatus
              ? ` Status: ${TARGET_STATUS_LABEL[data.focusStatus]}.`
              : ""}
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium">Growth target</p>
            <p className="text-xs text-muted-foreground">
              {peso(sales)} of {peso(settings.growthTargetCents)}
            </p>
          </div>
          <Bar
            pct={growth.pct}
            label="Growth target progress"
            className={growth.achieved ? "bg-emerald-500" : "bg-sky-500"}
          />
          <p className="text-xs text-muted-foreground">
            {growth.achieved
              ? "Growth target achieved."
              : `${peso(growth.remainingCents)} left.`}
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium">
              Monthly target ({settings.operatingDays} days)
            </p>
            <p className="text-xs text-muted-foreground">
              {peso(data.monthTotals.salesCents)} of{" "}
              {peso(monthlyTarget.monthlyTargetCents)}
            </p>
          </div>
          <Bar
            pct={monthly.pct}
            label="Monthly target progress"
            className={monthly.achieved ? "bg-emerald-500" : "bg-violet-500"}
          />
          <p
            className="text-xs text-muted-foreground"
            data-testid="target-required"
          >
            {monthly.achieved
              ? "Monthly target achieved."
              : monthlyTarget.requiredDailyCents === null
                ? `${peso(monthlyTarget.remainingCents)} short of the monthly target.`
                : `Needs about ${peso(monthlyTarget.requiredDailyCents)} a day over the remaining ${Math.max(0, settings.operatingDays - data.operatingDaysDone)} operating days.`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
