import Link from "next/link";
import { Pencil } from "lucide-react";

import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteSaleAction } from "@/lib/actions/sales";
import { formatDate, formatPeso } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/sales/constants";
import type { SaleListRow } from "@/lib/sales/queries";

export function SalesTable({ rows }: { rows: SaleListRow[] }) {
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Date</TableHead>
            <TableHead>Transaction</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="whitespace-nowrap">{formatDate(sale.transactionDate)}</TableCell>
              <TableCell>
                <Link href={`/sales/${sale.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
                  {sale.transactionNumber}
                </Link>
              </TableCell>
              <TableCell className="max-w-40 truncate">{sale.customerName ?? <span className="text-muted-foreground">Walk-in</span>}</TableCell>
              <TableCell className="max-w-56 truncate text-muted-foreground">
                {sale.itemCount} · {sale.categories.join(", ")}
              </TableCell>
              <TableCell>{PAYMENT_METHOD_LABELS[sale.paymentMethod]}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatPeso(sale.totalAmount)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button asChild variant="ghost" size="icon" aria-label={`Edit ${sale.transactionNumber}`}>
                    <Link href={`/sales/${sale.id}/edit`}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <ConfirmDeleteButton
                    action={deleteSaleAction.bind(null, sale.id)}
                    title="Delete this sale?"
                    description={`${sale.transactionNumber} and all of its items will be permanently removed. This cannot be undone.`}
                    successMessage={`Deleted ${sale.transactionNumber}.`}
                    ariaLabel={`Delete ${sale.transactionNumber}`}
                    confirmLabel="Delete sale"
                    iconOnly
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
