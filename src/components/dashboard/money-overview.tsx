import Link from "next/link";
import { ChevronRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildMoneyOverview,
  type OverviewRow,
  type Tone,
} from "@/lib/dashboard/overview";
import type { DashboardData } from "@/lib/dashboard/queries";
import { periodLabel } from "@/lib/dashboard/period";
import { formatPeso } from "@/lib/format";
import { cn } from "@/lib/utils";

const money = (cents: number) => formatPeso(cents / 100);

const toneClass = (tone: Tone) =>
  tone === "negative"
    ? "text-destructive"
    : tone === "positive"
      ? "text-primary"
      : "";

function Row({
  row,
  bold = false,
  tone = "neutral",
}: {
  row: OverviewRow;
  bold?: boolean;
  tone?: Tone;
}) {
  const content = (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className={cn("text-sm", bold ? "font-semibold" : "font-medium")}>
          {row.label}
        </p>
        {row.hint ? (
          <p className="text-xs text-muted-foreground">{row.hint}</p>
        ) : null}
      </div>
      <p
        className={cn(
          "shrink-0 tabular-nums",
          bold ? "text-base font-semibold" : "text-sm",
          toneClass(tone),
        )}
        data-testid={`${row.id}-value`}
      >
        {money(row.cents)}
      </p>
    </div>
  );
  return (
    <div data-testid={row.id}>
      {row.href ? (
        <Link
          href={row.href}
          className="-mx-2 block rounded-md px-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}

/** The whole money picture in plain words: in, out, kept, running total, debts. */
export function MoneyOverview({ data }: { data: DashboardData }) {
  const label = periodLabel(data.period);
  const o = buildMoneyOverview(data, label);

  return (
    <div className="space-y-4">
      <section
        aria-label={`Summary for ${label}`}
        className="grid gap-4 sm:grid-cols-3"
      >
        {o.headline.map((card) => (
          <Card key={card.id} className="gap-1 py-4" data-testid={card.id}>
            <CardContent>
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p
                className={cn(
                  "mt-1 break-words text-3xl font-semibold tabular-nums",
                  toneClass(card.tone),
                )}
                data-testid={`${card.id}-value`}
              >
                {money(card.cents)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>How the profit adds up</CardTitle>
            <CardDescription>Everything counted for {label}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Money in
              </h3>
              <div className="divide-y">
                {o.moneyIn.map((row) => (
                  <Row key={row.id} row={row} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Money out
              </h3>
              <div className="divide-y">
                {o.moneyOut.map((row) => (
                  <Row key={row.id} row={row} />
                ))}
              </div>
            </div>
            <div className="border-t pt-2">
              <Row
                row={{
                  id: "profit-line",
                  label: "Profit",
                  cents: data.summary.netIncomeCents,
                }}
                bold
                tone={o.headline[2].tone}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Running total</CardTitle>
              <CardDescription>
                Your profit carried from month to month, like your Excel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="divide-y">
                <Row
                  row={o.running.broughtForward}
                  tone={
                    o.running.broughtForward.cents < 0 ? "negative" : "neutral"
                  }
                />
                <Row row={o.running.thisMonth} />
              </div>
              <div className="border-t pt-2">
                <Row
                  row={o.running.total}
                  bold
                  tone={o.running.total.cents < 0 ? "negative" : "positive"}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Link
                href={o.debt.href ?? "/records?tab=debts"}
                className="-m-2 flex items-center justify-between gap-3 rounded-md p-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                data-testid={o.debt.id}
              >
                <div>
                  <p className="text-sm font-medium">{o.debt.label}</p>
                  <p className="text-xs text-muted-foreground">{o.debt.hint}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p
                    className="text-lg font-semibold tabular-nums"
                    data-testid={`${o.debt.id}-value`}
                  >
                    {money(o.debt.cents)}
                  </p>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </Link>
            </CardContent>
          </Card>

          <details
            className="group rounded-xl border bg-card px-6 py-4"
            data-testid="gcash-moved"
          >
            <summary className="cursor-pointer text-sm font-medium">
              GCash cash handled for customers
            </summary>
            <p className="mt-2 text-xs text-muted-foreground">
              This is customers&apos; money passing through, so it is never
              counted as income. Only the fee is.
            </p>
            <dl className="mt-2 space-y-1 text-sm">
              {o.gcashMoved.map((item) => (
                <div key={item.label} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="tabular-nums">{money(item.cents)}</dd>
                </div>
              ))}
            </dl>
          </details>
        </div>
      </div>
    </div>
  );
}
