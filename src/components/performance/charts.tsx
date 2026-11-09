"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
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
import { monthLabel } from "@/lib/performance/months";

const GRID = "var(--border)";
const AXIS = "var(--muted-foreground)";
const SALES = "#3b82f6";
const COST = "#f59e0b";
const PROFIT = "#10b981";
const LOSS = "var(--destructive)";

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

export interface PerformanceChartsProps {
  /** Pesos, not centavos. */
  days: { label: string; sales: number }[];
  trend: { month: string; sales: number; expenses: number; net: number }[];
  breakdown: { name: string; value: number }[];
  dailyTarget: number;
  breakEven: number | null;
}

export function PerformanceCharts({
  days,
  trend,
  breakdown,
  dailyTarget,
  breakEven,
}: PerformanceChartsProps) {
  const trendData = trend.map((t) => ({
    ...t,
    name: monthLabel(t.month, true),
  }));
  const hasDays = days.some((d) => d.sales > 0);
  const hasTrend = trend.some((t) => t.sales > 0 || t.expenses > 0);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard
        testId="chart-daily"
        title="Daily sales vs target"
        description="Each bar is a day. Lines show the daily target and the break-even."
        hasData={hasDays}
        emptyText="No sales recorded this month yet."
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={days}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          >
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
            <Bar
              dataKey="sales"
              name="Sales"
              fill={SALES}
              radius={[3, 3, 0, 0]}
            />
            <ReferenceLine
              y={dailyTarget}
              stroke={PROFIT}
              strokeDasharray="5 4"
              label={{
                value: "Target",
                fill: AXIS,
                fontSize: 11,
                position: "insideTopRight",
              }}
            />
            {breakEven !== null ? (
              <ReferenceLine
                y={breakEven}
                stroke={COST}
                strokeDasharray="2 3"
                label={{
                  value: "Break-even",
                  fill: AXIS,
                  fontSize: 11,
                  position: "insideBottomRight",
                }}
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        testId="chart-revenue"
        title="Monthly revenue trend"
        description="Gross sales against total costs, last 6 months."
        hasData={hasTrend}
        emptyText="No records in these months yet."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={trendData}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          >
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fill: AXIS, fontSize: 12 }}
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
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="sales"
              name="Gross sales"
              fill={SALES}
              radius={[3, 3, 0, 0]}
            />
            <Bar
              dataKey="expenses"
              name="Total costs"
              fill={COST}
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        testId="chart-net"
        title="Net profit trend"
        description="Profit (green) or loss (red) after materials, fixed costs and other expenses."
        hasData={hasTrend}
        emptyText="No records in these months yet."
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={trendData}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          >
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fill: AXIS, fontSize: 12 }}
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
            <ReferenceLine y={0} stroke={AXIS} />
            <Bar dataKey="net" name="Net profit" radius={[3, 3, 0, 0]}>
              {trendData.map((t) => (
                <Cell key={t.month} fill={t.net < 0 ? LOSS : PROFIT} />
              ))}
            </Bar>
            <Line
              dataKey="sales"
              name="Gross sales"
              stroke={SALES}
              dot={false}
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        testId="chart-breakdown"
        title="Monthly expense breakdown"
        description="Fixed costs, materials and other costs, largest first."
        hasData={breakdown.length > 0}
        emptyText="No costs recorded this month."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={breakdown}
            layout="vertical"
            margin={{ top: 4, right: 12, bottom: 0, left: 8 }}
          >
            <CartesianGrid horizontal={false} stroke={GRID} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fill: AXIS, fontSize: 12 }}
              tickFormatter={compact}
            />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={110}
              tick={{ fill: AXIS, fontSize: 12 }}
            />
            <Tooltip
              formatter={peso}
              cursor={{ fill: "var(--muted)" }}
              contentStyle={tooltipStyle}
            />
            <Bar
              dataKey="value"
              name="Amount"
              fill={COST}
              radius={[0, 3, 3, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
