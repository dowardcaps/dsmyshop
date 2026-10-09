import Link from "next/link";
import { Pencil } from "lucide-react";

import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteGcashAction } from "@/lib/actions/gcash";
import { formatDate, formatPeso } from "@/lib/format";
import {
  GCASH_PROVIDER_LABELS,
  GCASH_TYPE_LABELS,
  type GcashTransactionTypeValue,
} from "@/lib/gcash/constants";
import type { GcashRow } from "@/lib/gcash/queries";

const TYPE_VARIANT: Record<GcashTransactionTypeValue, "success" | "warning" | "info"> = {
  CASH_IN: "success",
  CASH_OUT: "warning",
  LOAD: "info",
};

export function GcashTable({ rows, editHref }: { rows: GcashRow[]; editHref: (id: string) => string }) {
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Charge</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const label = `${GCASH_TYPE_LABELS[row.transactionType]} of ${formatPeso(row.amount)} on ${formatDate(row.transactionDate)}`;
            return (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap">{formatDate(row.transactionDate)}</TableCell>
                <TableCell>
                  <Badge variant={TYPE_VARIANT[row.transactionType]}>{GCASH_TYPE_LABELS[row.transactionType]}</Badge>
                </TableCell>
                <TableCell>{GCASH_PROVIDER_LABELS[row.provider]}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPeso(row.amount)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatPeso(row.charge)}</TableCell>
                <TableCell className="max-w-56 truncate text-muted-foreground">{row.notes ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" aria-label={`Edit ${label}`}>
                      <Link href={editHref(row.id)} scroll={false}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <ConfirmDeleteButton
                      action={deleteGcashAction.bind(null, row.id)}
                      title="Delete this transaction?"
                      description={`The ${label} will be permanently removed. This cannot be undone.`}
                      successMessage="Transaction deleted."
                      ariaLabel={`Delete ${label}`}
                      confirmLabel="Delete transaction"
                      iconOnly
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
