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

  const cards = [
    { id: "total-sales", label: "Total Sales", value: summary.salesCents, hint: `${data.counts.sales} sale${data.counts.sales === 1 ? "" : "s"} in ${label}` },
    { id: "total-expenses", label: "Total Expenses", value: summary.expensesCents, hint: `${data.counts.expenses} expense${data.counts.expenses === 1 ? "" : "s"} in ${label}` },
    { id: "gcash-charges", label: "GCash Charges", value: summary.gcashChargesCents, hint: "Fees earned. Cash in/out amounts are not income" },
    {
      id: "net-income",
      label: "Net Income",
      value: net,
      hint: "Sales + GCash charges − expenses",
      tone: net < 0 ? "negative" : net > 0 ? "positive" : "neutral",
    },
    {
      id: "outstanding-debt",
      label: "Outstanding Debt",
      value: summary.outstandingDebtCents,
      hint: `${summary.openDebtCount} open debt${summary.openDebtCount === 1 ? "" : "s"}, as of today`,
      href: "/records?tab=debts",
    },
  ] as const;

  return (
    <section aria-label={`Summary for ${label}`} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const tone = "tone" in card ? card.tone : "neutral";
        const body = (
          <Card className="h-full gap-1 py-4" data-testid={card.id}>
            <CardContent>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.label}</p>
              <p
                className={cn(
                  "mt-1 text-2xl font-semibold tabular-nums",
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
