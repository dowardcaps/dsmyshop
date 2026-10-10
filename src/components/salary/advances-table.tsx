import Link from "next/link";
import { Lock, Pencil } from "lucide-react";

import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteAdvanceAction } from "@/lib/actions/salary";
import { formatDate, formatPeso } from "@/lib/format";
import type { AdvanceRow } from "@/lib/salary/queries";

export function AdvancesTable({ rows, editHref }: { rows: AdvanceRow[]; editHref: (id: string) => string }) {
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Date given</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Deducted from</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const label = `${row.employeeName} advance of ${formatPeso(row.amountCents / 100)} on ${formatDate(row.advanceDate)}`;
            return (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap">{formatDate(row.advanceDate)}</TableCell>
                <TableCell className="font-medium">{row.employeeName}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatPeso(row.amountCents / 100)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(row.payDate)} salary</TableCell>
                <TableCell className="max-w-56 truncate text-muted-foreground">{row.notes ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {row.periodPaid ? (
                      <span className="inline-flex items-center gap-1 px-2 text-xs text-muted-foreground" title="That salary is already paid. Mark it unpaid to change this advance.">
                        <Lock className="size-3.5" /> Paid
                      </span>
                    ) : (
                      <>
                        <Button asChild variant="ghost" size="icon" aria-label={`Edit ${label}`}>
                          <Link href={editHref(row.id)} scroll={false}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <ConfirmDeleteButton
                          action={deleteAdvanceAction.bind(null, row.id)}
                          title="Delete this cash advance?"
                          description={`The ${label} will be removed and the salary balance goes back up. This cannot be undone.`}
                          successMessage="Cash advance deleted."
                          ariaLabel={`Delete ${label}`}
                          confirmLabel="Delete cash advance"
                          iconOnly
                        />
                      </>
                    )}
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
