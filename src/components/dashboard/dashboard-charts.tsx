"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategorySlice, MonthlyPoint } from "@/lib/dashboard/calc";
import { MONTH_SHORT } from "@/lib/dashboard/period";
import { formatPeso } from "@/lib/format";

const GRID = "var(--border)";
const AXIS = "var(--muted-foreground)";
const PRIMARY = "var(--primary)";
const EXPENSE = "#f59e0b";
const NEGATIVE = "var(--destructive)";

const peso = (value: unknown) => formatPeso(Number(value) || 0);
const compact = (value: number) =>
  new Intl.NumberFormat("en-PH", { notation: "compact", maximumFractionDigits: 1 }).format(value);

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
};

interface ChartCardProps {
  title: string;
  description: string;
  testId: string;
  hasData: boolean;
  emptyText: string;
  children: React.ReactNode;
}

function ChartCard({ title, description, testId, hasData, emptyText, children }: ChartCardProps) {
  return (
    <Card data-testid={testId}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-64 w-full">{children}</div>
        ) : (
          <p className="flex h-64 items-center justify-center text-center text-sm text-muted-foreground">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  );
}

function MonthlyBars({ data, dataKey, color, signed = false }: { data: { name: string; value: number }[]; dataKey: "value"; color: string; signed?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} width={48} tick={{ fill: AXIS, fontSize: 12 }} tickFormatter={compact} />
        <Tooltip formatter={peso} cursor={{ fill: "var(--muted)" }} contentStyle={tooltipStyle} />
        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} fill={color} name="Amount">
          {signed ? data.map((point) => <Cell key={point.name} fill={point.value < 0 ? NEGATIVE : color} />) : null}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface DashboardChartsProps {
  monthly: MonthlyPoint[];
  salesByCategory: CategorySlice[];
  year: number;
  periodText: string;
}

export function DashboardCharts({ monthly, salesByCategory, year, periodText }: DashboardChartsProps) {
  const series = (pick: (point: MonthlyPoint) => number) =>
    monthly.map((point) => ({ name: MONTH_SHORT[point.month - 1], value: pick(point) / 100 }));

  const sales = series((p) => p.salesCents);
  const expenses = series((p) => p.expensesCents);
  const net = series((p) => p.netIncomeCents);
  const categories = salesByCategory.map((slice) => ({ name: slice.name, value: slice.cents / 100 }));

  return (
    <section aria-label="Charts" className="grid gap-4 lg:grid-cols-2">
      <ChartCard
        title="Sales by month"
        description={`${year}, all sales`}
        testId="chart-sales"
        hasData={sales.some((p) => p.value !== 0)}
        emptyText={`No sales recorded in ${year}.`}
      >
        <MonthlyBars data={sales} dataKey="value" color={PRIMARY} />
      </ChartCard>
      <ChartCard
        title="Expenses by month"
        description={`${year}, all expenses`}
        testId="chart-expenses"
        hasData={expenses.some((p) => p.value !== 0)}
        emptyText={`No expenses recorded in ${year}.`}
      >
        <MonthlyBars data={expenses} dataKey="value" color={EXPENSE} />
      </ChartCard>
      <ChartCard
        title="Net income by month"
        description={`${year}: sales + GCash charges − expenses`}
        testId="chart-net"
        hasData={net.some((p) => p.value !== 0)}
        emptyText={`No income or expenses recorded in ${year}.`}
      >
        <MonthlyBars data={net} dataKey="value" color={PRIMARY} signed />
      </ChartCard>
      <ChartCard
        title="Sales by category"
        description={periodText}
        testId="chart-categories"
        hasData={categories.length > 0}
        emptyText={`No sales in ${periodText}.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categories} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid horizontal={false} stroke={GRID} />
            <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 12 }} tickFormatter={compact} />
            <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={96} tick={{ fill: AXIS, fontSize: 12 }} />
            <Tooltip formatter={peso} cursor={{ fill: "var(--muted)" }} contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill={PRIMARY} radius={[0, 4, 4, 0]} name="Sales" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}
