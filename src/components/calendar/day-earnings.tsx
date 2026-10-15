import type { DailyIncome } from "@/lib/finance/ledger";
import { formatPeso } from "@/lib/format";

/** What came in on the selected day, split the way it adds up. */
export function DayEarnings({ income }: { income: DailyIncome | undefined }) {
  const money = (cents: number) => formatPeso(cents / 100);
  const rows: [string, number][] = income
    ? [
        ["Sales", income.salesCents],
        ["GCash charges", income.gcashChargesCents],
        ["Excess money", income.excessCents],
      ]
    : [];

  return (
    <div
      className="mb-5 rounded-lg border bg-muted/40 px-4 py-3"
      data-testid="day-earnings"
    >
      {income ? (
        <dl className="space-y-1 text-sm">
          {rows.map(([label, cents]) => (
            <div key={label} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="tabular-nums">{money(cents)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 border-t pt-1 font-semibold">
            <dt>Earned this day</dt>
            <dd className="tabular-nums" data-testid="day-earnings-total">
              {money(income.totalCents)}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nothing earned or recorded on this day.
        </p>
      )}
    </div>
  );
}
