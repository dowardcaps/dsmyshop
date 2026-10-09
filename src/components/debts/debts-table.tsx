import Link from "next/link";
import { Eye, Pencil } from "lucide-react";

import { DebtStatusBadge } from "@/components/debts/debt-status-badge";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteDebtAction } from "@/lib/actions/debts";
import type { DebtRow } from "@/lib/debts/queries";
import { formatDate, formatPeso } from "@/lib/format";

export function DebtsTable({ rows, editHref }: { rows: DebtRow[]; editHref: (id: string) => string }) {
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Debt</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Original</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((debt) => (
            <TableRow key={debt.id}>
              <TableCell className="max-w-56 truncate">
                <Link href={`/debts/${debt.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
                  {debt.name}
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatDate(debt.debtDate)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatPeso(debt.originalAmount)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatPeso(debt.totalPaid)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatPeso(debt.balance)}</TableCell>
              <TableCell>
                <DebtStatusBadge status={debt.status} />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button asChild variant="ghost" size="icon" aria-label={`View ${debt.name}`}>
                    <Link href={`/debts/${debt.id}`}>
                      <Eye className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="icon" aria-label={`Edit ${debt.name}`}>
                    <Link href={editHref(debt.id)} scroll={false}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <ConfirmDeleteButton
                    action={deleteDebtAction.bind(null, debt.id)}
                    title="Delete this debt?"
                    description={`"${debt.name}" will be permanently removed. This cannot be undone.`}
                    successMessage={`Deleted ${debt.name}.`}
                    ariaLabel={`Delete ${debt.name}`}
                    confirmLabel="Delete debt"
                    iconOnly
                    disabled={debt.paymentCount > 0}
                    disabledReason={`Has ${debt.paymentCount} payment${debt.paymentCount === 1 ? "" : "s"} recorded. Delete the payments first.`}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
