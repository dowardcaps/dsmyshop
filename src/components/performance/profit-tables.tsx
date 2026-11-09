import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatPeso } from "@/lib/format";
import { parseDateInput } from "@/lib/dates";
import type { PerformanceData } from "@/lib/performance/queries";
import { cn } from "@/lib/utils";

const peso = (cents: number) => formatPeso(cents / 100);
const pct = (value: number | null) =>
  value === null ? "-" : `${value.toFixed(1)}%`;
const tone = (cents: number) =>
  cents > 0
    ? "text-emerald-600 dark:text-emerald-400"
    : cents < 0
      ? "text-destructive"
      : "";

export function MonthlyProfitLoss({ data }: { data: PerformanceData }) {
  const t = data.monthTotals;
  const share = (cents: number) =>
    t.salesCents > 0 ? `${((cents / t.salesCents) * 100).toFixed(1)}%` : "-";
  const rows: {
    label: string;
    cents: number;
    sign: "+" | "-" | "";
    strong?: boolean;
  }[] = [
    { label: "Gross sales", cents: t.salesCents, sign: "", strong: true },
    { label: "Material costs", cents: t.materialCents, sign: "-" },
    {
      label: "Gross profit",
      cents: t.profit.grossProfitCents,
      sign: "",
      strong: true,
    },
    ...data.fixedLines.map((l) => ({
      label: `Fixed: ${l.name}`,
      cents: l.cents,
      sign: "-" as const,
    })),
    { label: "Other expenses", cents: t.otherCents, sign: "-" },
  ];
  return (
    <Card data-testid="monthly-pl" className="break-inside-avoid">
      <CardHeader>
        <CardTitle>Monthly profit and loss</CardTitle>
        <CardDescription>
          Fixed costs are counted once for the month. Profit here is not the
          same as cash on hand.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">% of sales</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.label}>
                <TableCell className={cn(r.strong && "font-medium")}>
                  {r.label}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    r.strong && "font-medium",
                  )}
                >
                  {r.sign === "-" && r.cents > 0 ? "− " : ""}
                  {peso(r.cents)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {share(r.cents)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-semibold">Net profit</TableCell>
              <TableCell
                className={cn(
                  "text-right font-semibold tabular-nums",
                  tone(t.profit.netProfitCents),
                )}
                data-testid="monthly-net"
              >
                {peso(t.profit.netProfitCents)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {pct(t.profit.marginPct)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

function BreakdownList({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { name: string; cents: number }[];
  empty: string;
}) {
  const sum = rows.reduce((s, r) => s + r.cents, 0);
  return (
    <Card className="break-inside-avoid">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="divide-y text-sm">
            {rows.map((r) => (
              <li
                key={r.name}
                className="flex items-center justify-between gap-3 py-1.5"
              >
                <span>{r.name}</span>
                <span className="tabular-nums">
                  {peso(r.cents)}{" "}
                  <span className="text-xs text-muted-foreground">
                    {sum > 0 ? `${((r.cents / sum) * 100).toFixed(0)}%` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

const methodLabel = (method: string) =>
  method
    .replace("_", " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());

export function BreakdownLists({ data }: { data: PerformanceData }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <BreakdownList
        title="Sales by category"
        rows={data.categorySales}
        empty="No sales this month."
      />
      <BreakdownList
        title="Payment methods"
        rows={data.paymentMethods.map((p) => ({
          name: methodLabel(p.method),
          cents: p.cents,
        }))}
        empty="No sales this month."
      />
    </div>
  );
}

export function DailyTable({ data }: { data: PerformanceData }) {
  const rows = [...data.days].reverse();
  const sum = (pick: (d: PerformanceData["days"][number]) => number) =>
    data.days.reduce((s, d) => s + pick(d), 0);
  return (
    <Card data-testid="daily-table">
      <CardHeader>
        <CardTitle>Daily profit and loss</CardTitle>
        <CardDescription>
          Each day with sales carries {peso(data.dailyFixedCents)} of fixed
          costs ({peso(data.monthlyFixedCents)} ÷ {data.settings.operatingDays}{" "}
          operating days). Days without sales carry none, so the monthly total
          can differ slightly.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Gross sales</TableHead>
              <TableHead className="text-right">Materials</TableHead>
              <TableHead className="text-right">Gross profit</TableHead>
              <TableHead className="text-right">Fixed share</TableHead>
              <TableHead className="text-right">Other</TableHead>
              <TableHead className="text-right">Net profit</TableHead>
              <TableHead className="text-right">Margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((d) => (
              <TableRow
                key={d.date}
                className={cn(
                  !d.operating &&
                    d.materialCents + d.otherCents === 0 &&
                    "text-muted-foreground",
                )}
              >
                <TableCell className="whitespace-nowrap">
                  {formatDate(parseDateInput(d.date))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {peso(d.salesCents)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {peso(d.materialCents)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {peso(d.profit.grossProfitCents)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {peso(d.profit.fixedCostCents)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {peso(d.otherCents)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium tabular-nums",
                    tone(d.profit.netProfitCents),
                  )}
                >
                  {peso(d.profit.netProfitCents)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {pct(d.profit.marginPct)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-semibold">Total of days</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {peso(sum((d) => d.salesCents))}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {peso(sum((d) => d.materialCents))}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {peso(sum((d) => d.profit.grossProfitCents))}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {peso(sum((d) => d.profit.fixedCostCents))}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {peso(sum((d) => d.otherCents))}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {peso(sum((d) => d.profit.netProfitCents))}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
