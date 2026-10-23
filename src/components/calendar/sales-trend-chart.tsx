"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MOVING_AVERAGE_DAYS,
  type Direction,
  type TrendMeasure,
  type TrendPoint,
  type TrendSummary,
} from "@/lib/calendar/trend";
import { formatPeso } from "@/lib/format";
import { cn } from "@/lib/utils";

const GRID = "var(--border)";
const AXIS = "var(--muted-foreground)";
const LINE = "var(--primary)";
const AVERAGE = "#f59e0b";

const MEASURES: { value: TrendMeasure; label: string; hint: string }[] = [
  { value: "sales", label: "Sales", hint: "Sales only" },
  {
    value: "earnings",
    label: "All earnings",
    hint: "Sales + GCash charges + excess money",
  },
];

const compact = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
const shortDate = (date: string) =>
  new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
};

interface SalesTrendChartProps {
  monthText: string;
  previousMonthText: string;
  points: TrendPoint[];
  summaries: Record<TrendMeasure, TrendSummary>;
}

function Change({
  summary,
  previousMonthText,
}: {
  summary: TrendSummary;
  previousMonthText: string;
}) {
  const direction: Direction | null = summary.direction;
  if (direction === null || summary.changePercent === null) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing from {previousMonthText} to compare with yet.
      </p>
    );
  }
  const Icon =
    direction === "up"
      ? ArrowUpRight
      : direction === "down"
        ? ArrowDownRight
        : ArrowRight;
  const tone =
    direction === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : direction === "down"
        ? "text-destructive"
        : "text-muted-foreground";
  const words =
    direction === "same"
      ? "About the same as"
      : direction === "up"
        ? "Up"
        : "Down";
  return (
    <p
      className={cn("flex items-center gap-1.5 text-sm font-medium", tone)}
      data-testid="trend-change"
      data-direction={direction}
    >
      <Icon className="size-4" aria-hidden />
      {words}{" "}
      {direction === "same"
        ? ""
        : `${Math.abs(summary.changePercent).toFixed(1)}% vs `}
      {direction === "same" ? previousMonthText : `${previousMonthText}`}
      <span className="font-normal text-muted-foreground">
        (same days, {formatPeso(summary.previousCents / 100)})
      </span>
    </p>
  );
}

export function SalesTrendChart({
  monthText,
  previousMonthText,
  points,
  summaries,
}: SalesTrendChartProps) {
  const [measure, setMeasure] = useState<TrendMeasure>("sales");
  const summary = summaries[measure];
  const data = points.map((p) => ({
    date: p.date,
    day: p.day,
    value: (measure === "sales" ? p.salesCents : p.earningsCents) / 100,
    average: (measure === "sales" ? p.salesAvgCents : p.earningsAvgCents) / 100,
  }));
  const hasData = data.some((p) => p.value !== 0);
  const active = MEASURES.find((m) => m.value === measure)!;

  return (
    <Card data-testid="sales-trend">
      <CardHeader className="gap-3 sm:flex sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle>Daily trend</CardTitle>
          <CardDescription>
            {active.hint}, day by day in {monthText}. The orange line is the{" "}
            {MOVING_AVERAGE_DAYS}-day average: if it climbs, sales are going up.
          </CardDescription>
        </div>
        <div
          role="group"
          aria-label="What to graph"
          className="inline-flex shrink-0 rounded-lg border bg-muted/40 p-1"
        >
          {MEASURES.map((m) => (
            <button
              key={m.value}
              type="button"
              aria-pressed={measure === m.value}
              data-testid={`trend-${m.value}`}
              onClick={() => setMeasure(m.value)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                measure === m.value
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasData ? (
          <>
            <div
              className="grid gap-x-6 gap-y-1 sm:grid-cols-3"
              data-testid="trend-stats"
            >
              <Stat
                label={`Total so far`}
                value={formatPeso(summary.totalCents / 100)}
              />
              <Stat
                label="Average per day"
                value={formatPeso(summary.dailyAverageCents / 100)}
              />
              <Stat
                label="Best day"
                value={
                  summary.best
                    ? `${formatPeso(summary.best.cents / 100)} · ${shortDate(summary.best.date)}`
                    : "-"
                }
              />
            </div>
            <Change summary={summary} previousMonthText={previousMonthText} />
            <div
              className="h-64 w-full"
              role="img"
              aria-label={`Bar graph of daily ${active.label.toLowerCase()} in ${monthText}`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={data}
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid vertical={false} stroke={GRID} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: AXIS, fontSize: 12 }}
                    interval="preserveStartEnd"
                    minTickGap={16}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tick={{ fill: AXIS, fontSize: 12 }}
                    tickFormatter={compact}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "var(--muted)" }}
                    labelFormatter={(_, items) =>
                      items?.[0]?.payload?.date
                        ? shortDate(items[0].payload.date)
                        : ""
                    }
                    formatter={(value, name) => [
                      formatPeso(Number(value) || 0),
                      name,
                    ]}
                  />
                  <Bar
                    dataKey="value"
                    name={active.label}
                    fill={LINE}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={28}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="average"
                    name={`${MOVING_AVERAGE_DAYS}-day average`}
                    stroke={AVERAGE}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <p
            className="flex h-40 items-center justify-center text-center text-sm text-muted-foreground"
            data-testid="trend-empty"
          >
            {points.length === 0
              ? `Nothing to graph yet for ${monthText}.`
              : `No ${active.label.toLowerCase()} recorded in ${monthText} so far.`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
