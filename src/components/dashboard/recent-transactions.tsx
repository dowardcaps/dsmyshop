import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RecentTransaction } from "@/lib/dashboard/queries";
import { formatDate, formatPeso } from "@/lib/format";
import {
  GCASH_PROVIDER_LABELS,
  GCASH_TYPE_LABELS,
  type GcashProviderValue,
  type GcashTransactionTypeValue,
} from "@/lib/gcash/constants";

const KIND_BADGE = {
  SALE: { label: "Sale", variant: "success" },
  EXPENSE: { label: "Expense", variant: "warning" },
  GCASH: { label: "GCash", variant: "info" },
} as const;

function titleOf(tx: RecentTransaction): string {
  return tx.kind === "GCASH" ? GCASH_TYPE_LABELS[tx.title as GcashTransactionTypeValue] ?? tx.title : tx.title;
}

function detailOf(tx: RecentTransaction): string {
  return tx.kind === "GCASH" ? GCASH_PROVIDER_LABELS[tx.detail as GcashProviderValue] ?? tx.detail : tx.detail;
}

export function RecentTransactions({ rows, periodText }: { rows: RecentTransaction[]; periodText: string }) {
  return (
    <Card data-testid="recent-transactions">
      <CardHeader>
        <CardTitle>Recent transactions</CardTitle>
        <CardDescription>Latest sales, expenses and GCash transactions in {periodText}.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nothing recorded in {periodText}.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Charge</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((tx) => {
                const badge = KIND_BADGE[tx.kind];
                return (
                  <TableRow key={tx.key}>
                    <TableCell className="whitespace-nowrap">{formatDate(tx.date, { month: "short", day: "numeric" })}</TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={tx.href} className="font-medium hover:underline">
                        {titleOf(tx)}
                      </Link>
                      <p className="text-xs text-muted-foreground">{detailOf(tx)}</p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {tx.kind === "EXPENSE" ? "−" : ""}
                      {formatPeso(tx.amountCents / 100)}
                      {tx.kind === "GCASH" ? <p className="text-xs text-muted-foreground">moved</p> : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {tx.chargeCents !== null ? formatPeso(tx.chargeCents / 100) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
