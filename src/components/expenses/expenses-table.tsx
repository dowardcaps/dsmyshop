import Link from "next/link";
import { Pencil } from "lucide-react";

import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteExpenseAction } from "@/lib/actions/expenses";
import type { ExpenseRow } from "@/lib/expenses/queries";
import { formatDate, formatPeso } from "@/lib/format";

export function ExpensesTable({ rows, editHref }: { rows: ExpenseRow[]; editHref: (id: string) => string }) {
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const label = `${row.description} (${formatPeso(row.amount)}, ${formatDate(row.expenseDate)})`;
            return (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap">{formatDate(row.expenseDate)}</TableCell>
                <TableCell>
                  <Badge>{row.categoryName}</Badge>
                </TableCell>
                <TableCell className="max-w-64 truncate font-medium">{row.description}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatPeso(row.amount)}</TableCell>
                <TableCell className="max-w-56 truncate text-muted-foreground">{row.notes ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" aria-label={`Edit ${label}`}>
                      <Link href={editHref(row.id)} scroll={false}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <ConfirmDeleteButton
                      action={deleteExpenseAction.bind(null, row.id)}
                      title="Delete this expense?"
                      description={`${label} will be permanently removed. This cannot be undone.`}
                      successMessage="Expense deleted."
                      ariaLabel={`Delete ${label}`}
                      confirmLabel="Delete expense"
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
