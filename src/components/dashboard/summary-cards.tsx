import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard/queries";
import { periodLabel } from "@/lib/dashboard/period";
import { formatPeso } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SummaryCards({ data }: { data: DashboardData }) {
  const { summary, period } = data;
  const label = periodLabel(period);
  const net = summary.netIncomeCents;

  const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
  const total = summary.totalNetIncomeCents;

  const cards = [
    { id: "total-sales", label: "Total Sales", value: summary.salesCents, hint: `${plural(data.counts.sales, "sale")} in ${label}` },
    { id: "gcash-charges", label: "GCash Charges", value: summary.gcashChargesCents, hint: "Fees earned. Cash in/out amounts are not income" },
    { id: "total-expenses", label: "Total Expenses", value: summary.expensesCents, hint: `${plural(data.counts.expenses, "expense")} in ${label}` },
    {
      id: "excess-money",
      label: "Excess Money",
      value: summary.excessCents,
      hint: `${plural(data.counts.excess, "record")} in ${label}. Added to net income`,
      href: "/records?tab=excess",
    },
    {
      id: "reimbursements",
      label: "Reimbursements",
      value: summary.reimbursementsCents,
      hint: `${plural(data.counts.reimbursements, "record")} in ${label}. Subtracted from net income`,
      href: "/records?tab=reimbursement",
    },
    {
      id: "salary-paid",
      label: "Salary Paid Out",
      value: summary.salaryPaidCents,
      hint: "Advances + paid pay dates. Subtracted from net income",
      href: "/records?tab=salary",
    },
    {
      id: "short",
      label: "Short",
      value: summary.shortCents,
      hint: `${plural(data.counts.short, "record")} in ${label}. Subtracted from net income`,
      href: "/records?tab=short",
    },
    {
      id: "outstanding-debt",
      label: "Outstanding Debt",
      value: summary.outstandingDebtCents,
      hint: `${plural(summary.openDebtCount, "open debt")}, as of today`,
      href: "/records?tab=debts",
    },
    {
      id: "net-income",
      label: `Net Income (${label})`,
      value: net,
      hint: "Sales + GCash charges + excess − expenses − reimbursements − salary − short",
      tone: net < 0 ? "negative" : net > 0 ? "positive" : "neutral",
    },
    {
      id: "brought-forward",
      label: "Brought Forward",
      value: summary.broughtForwardCents,
      hint: "Net income of all earlier months",
      tone: summary.broughtForwardCents < 0 ? "negative" : "neutral",
    },
    {
      id: "total-net-income",
      label: "Total Net Income",
      value: total,
      hint: "Brought forward + net income. Same as TOTAL NET INCOME in Sales.xlsx",
      tone: total < 0 ? "negative" : total > 0 ? "positive" : "neutral",
    },
  ] as const;

  return (
    <section aria-label={`Summary for ${label}`} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const tone = "tone" in card ? card.tone : "neutral";
        const body = (
          <Card className="h-full gap-1 py-4" data-testid={card.id}>
            <CardContent>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.label}</p>
              <p
                className={cn(
                  "mt-1 break-words text-2xl font-semibold tabular-nums",
                  tone === "negative" && "text-destructive",
                  tone === "positive" && "text-primary",
                )}
                data-testid={`${card.id}-value`}
              >
                {formatPeso(card.value / 100)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
            </CardContent>
          </Card>
        );
        return "href" in card ? (
          <Link key={card.id} href={card.href} className="rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            {body}
          </Link>
        ) : (
          <div key={card.id}>{body}</div>
        );
      })}
    </section>
  );
}
