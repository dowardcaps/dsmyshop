import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard/queries";
import { formatPeso } from "@/lib/format";

/** Keeps revenue, cash movements, expenses and adjustments visibly apart. */
export function BreakdownCard({ data }: { data: DashboardData }) {
  const { summary, cashMovements, adjustments } = data;
  const money = (cents: number) => formatPeso(cents / 100);

  const groups = [
    {
      title: "Revenue",
      note: "Counted in net income",
      rows: [
        ["Sales", money(summary.salesCents)],
        ["GCash charges", money(summary.gcashChargesCents)],
        ["Total revenue", money(summary.revenueCents)],
        ["Excess money", money(summary.excessCents)],
        ["Revenue + excess", money(summary.revenueCents + summary.excessCents)],
      ],
    },
    {
      title: "GCash cash movements",
      note: "Money moved for customers. Not income",
      rows: [
        ["Cash In", money(cashMovements.cashInCents)],
        ["Cash Out", money(cashMovements.cashOutCents)],
        ["Load", money(cashMovements.loadCents)],
      ],
    },
    {
      title: "Expenses",
      note: "Subtracted from revenue + excess",
      rows: [["Total expenses", money(summary.expensesCents)]],
    },
    {
      title: "Adjustments",
      note: "Salary, reimbursements, other. Kept separate",
      rows: [[`${adjustments.count} adjustment${adjustments.count === 1 ? "" : "s"}`, money(adjustments.totalCents)]],
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where the money is</CardTitle>
        <CardDescription>Revenue, cash movements, expenses and adjustments are never mixed together.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group) => (
          <div key={group.title} className="space-y-2">
            <div>
              <h3 className="text-sm font-semibold">{group.title}</h3>
              <p className="text-xs text-muted-foreground">{group.note}</p>
            </div>
            <dl className="space-y-1 text-sm">
              {group.rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
