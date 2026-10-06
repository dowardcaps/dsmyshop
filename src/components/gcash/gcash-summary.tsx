import { Card, CardContent } from "@/components/ui/card";
import { formatPeso } from "@/lib/format";

interface GcashSummaryProps {
  count: number;
  totalAmount: number;
  totalCharges: number;
  filtered: boolean;
}

export function GcashSummary({ count, totalAmount, totalCharges, filtered }: GcashSummaryProps) {
  const stats = [
    { label: "Transactions", value: count.toLocaleString("en-PH"), hint: undefined },
    { label: "Total amount", value: formatPeso(totalAmount), hint: "Money moved, not income" },
    { label: "Total charges", value: formatPeso(totalCharges), hint: "Your fees, counted as income" },
  ];

  return (
    <section aria-label={filtered ? "Summary of filtered transactions" : "Summary of all transactions"} className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="gap-1 py-4">
          <CardContent>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {stat.label}
              {filtered ? " (filtered)" : ""}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{stat.value}</p>
            {stat.hint ? <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p> : null}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
