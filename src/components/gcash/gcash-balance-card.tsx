import { Wallet } from "lucide-react";

import { GcashBalanceDialog } from "@/components/gcash/gcash-balance-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { GcashBalanceSummary } from "@/lib/gcash/balance-service";
import { formatPeso } from "@/lib/format";
import { cn } from "@/lib/utils";

const when = (date: Date) =>
  new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(date);

/** The wallet balance the system keeps up to date, so nobody has to open the GCash app to check. */
export function GcashBalanceCard({
  balance,
}: {
  balance: GcashBalanceSummary;
}) {
  if (!balance.hasCheckpoint) {
    return (
      <Card data-testid="gcash-balance-card">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Wallet className="size-6 text-muted-foreground" />
            <div>
              <p className="font-medium">Track your GCash balance</p>
              <p className="text-sm text-muted-foreground">
                Type what the GCash app shows now. After that, every transaction
                updates it.
              </p>
            </div>
          </div>
          <GcashBalanceDialog>
            <Button>Set balance</Button>
          </GcashBalanceDialog>
        </CardContent>
      </Card>
    );
  }

  const negative = balance.balanceCents < 0;
  return (
    <Card data-testid="gcash-balance-card">
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Wallet className="size-6 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">GCash balance now</p>
            <p
              className={cn(
                "text-3xl font-semibold tabular-nums",
                negative && "text-destructive",
              )}
              data-testid="gcash-balance-value"
            >
              {formatPeso(balance.balanceCents / 100)}
            </p>
            <p className="text-xs text-muted-foreground">
              Set to {formatPeso(balance.checkpointCents / 100)} on{" "}
              {balance.checkpointAt ? when(balance.checkpointAt) : ""}, then{" "}
              {balance.transactionsSince} GCash transaction
              {balance.transactionsSince === 1 ? "" : "s"}
              {balance.gcashSalesSince > 0
                ? ` and ${balance.gcashSalesSince} sale${balance.gcashSalesSince === 1 ? "" : "s"} paid by GCash (+${formatPeso(balance.gcashSalesCents / 100)})`
                : ""}{" "}
              since.
              {negative
                ? " Negative means a transaction is missing or wrong."
                : ""}
            </p>
          </div>
        </div>
        <GcashBalanceDialog currentBalance={balance.balanceCents / 100}>
          <Button variant="outline">Update from GCash app</Button>
        </GcashBalanceDialog>
      </CardContent>
    </Card>
  );
}
