import { Pencil } from "lucide-react";

import { PaymentDialog } from "@/components/debts/payment-dialog";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deletePaymentAction } from "@/lib/actions/debts";
import type { DebtPaymentRow } from "@/lib/debts/queries";
import { formatDate, formatPeso } from "@/lib/format";

interface PaymentsTableProps {
  debtId: string;
  payments: DebtPaymentRow[];
  /** Remaining balance of the debt. */
  balance: number;
}

export function PaymentsTable({ debtId, payments, balance }: PaymentsTableProps) {
  return (
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
        {payments.map((payment) => {
          const label = `payment of ${formatPeso(payment.amount)} on ${formatDate(payment.paymentDate)}`;
          return (
            <TableRow key={payment.id}>
              <TableCell className="whitespace-nowrap">{formatDate(payment.paymentDate)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatPeso(payment.amount)}</TableCell>
              <TableCell className="max-w-64 truncate text-muted-foreground">{payment.notes ?? "-"}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <PaymentDialog debtId={debtId} payment={payment} maxAmount={balance + payment.amount}>
                    <Button variant="ghost" size="icon" aria-label={`Edit ${label}`}>
                      <Pencil className="size-4" />
                    </Button>
                  </PaymentDialog>
                  <ConfirmDeleteButton
                    action={deletePaymentAction.bind(null, debtId, payment.id)}
                    title="Delete this payment?"
                    description={`The ${label} will be removed and the debt's balance and status will be updated.`}
                    successMessage="Payment deleted."
                    ariaLabel={`Delete ${label}`}
                    confirmLabel="Delete payment"
                    iconOnly
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
