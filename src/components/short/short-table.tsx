import Link from "next/link";
import { Pencil } from "lucide-react";

import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteShortAction } from "@/lib/actions/short";
import type { ShortRow } from "@/lib/short/queries";
import { formatDate, formatPeso } from "@/lib/format";

export function ShortTable({ rows, editHref }: { rows: ShortRow[]; editHref: (id: string) => string }) {
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const label = `short of ${formatPeso(row.amount)} on ${formatDate(row.shortDate)}`;
            return (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap">{formatDate(row.shortDate)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatPeso(row.amount)}</TableCell>
                <TableCell className="max-w-72 truncate text-muted-foreground">{row.notes ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" aria-label={`Edit ${label}`}>
                      <Link href={editHref(row.id)} scroll={false}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <ConfirmDeleteButton
                      action={deleteShortAction.bind(null, row.id)}
                      title="Delete this record?"
                      description={`The ${label} will be permanently removed. This cannot be undone.`}
                      successMessage="Record deleted."
                      ariaLabel={`Delete ${label}`}
                      confirmLabel="Delete record"
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
