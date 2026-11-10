"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
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
import { formatPeso } from "@/lib/format";

const GRID = "var(--border)";
const AXIS = "var(--muted-foreground)";
const SALES = "#3b82f6";
const PROFIT = "#10b981";

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
};
const compact = (v: number) =>
  new Intl.NumberFormat("en-PH", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);
const peso = (v: unknown) => formatPeso(Number(v) || 0);

function ChartCard({
  title,
  description,
  hasData,
  emptyText,
  testId,
  children,
}: {
  title: string;
  description: string;
  hasData: boolean;
  emptyText: string;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <Card data-testid={testId} className="break-inside-avoid">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-64 w-full">{children}</div>
        ) : (
          <p className="flex h-64 items-center justify-center text-center text-sm text-muted-foreground">
            {emptyText}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/** The one chart on the simple Overview: each day is green when it reached the daily target. */
export function DailyTargetChart({
  days,
  dailyTarget,
}: {
  days: { label: string; sales: number }[];
  dailyTarget: number;
}) {
  const hasDays = days.some((d) => d.sales > 0);
  return (
    <ChartCard
      testId="chart-daily-simple"
      title="Daily sales"
      description="Green days reached the target. The dashed line is the target."
      hasData={hasDays}
      emptyText="No sales recorded this month yet."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={days} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: AXIS, fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tick={{ fill: AXIS, fontSize: 12 }}
            tickFormatter={compact}
          />
          <Tooltip
            formatter={peso}
            cursor={{ fill: "var(--muted)" }}
            contentStyle={tooltipStyle}
          />
          <Bar dataKey="sales" name="Sales" radius={[3, 3, 0, 0]}>
            {days.map((d) => (
              <Cell
                key={d.label}
                fill={d.sales >= dailyTarget ? PROFIT : SALES}
              />
            ))}
          </Bar>
          <ReferenceLine
            y={dailyTarget}
            stroke={PROFIT}
            strokeDasharray="5 4"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
