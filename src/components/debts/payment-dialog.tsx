"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDebtPaymentForm } from "@/hooks/use-debt-payment-form";
import { formatPeso } from "@/lib/format";

interface PaymentDialogProps {
  debtId: string;
  /** The most this payment can be: the remaining balance (plus this payment's own amount when editing). */
  maxAmount: number;
  /** Omit to record a new payment. */
  payment?: { id: string; paymentDate: Date; amount: number; notes: string | null };
  /** The button that opens the dialog. */
  children: React.ReactNode;
}

export function PaymentDialog({ debtId, maxAmount, payment, children }: PaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const { form, submit, resetForm } = useDebtPaymentForm({ debtId, payment, onSaved: () => setOpen(false) });
  const {
    register,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetForm();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{payment ? "Edit payment" : "Record payment"}</DialogTitle>
            <DialogDescription>Remaining balance you can pay: {formatPeso(maxAmount)}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Date</Label>
            <Input id="paymentDate" type="date" aria-invalid={!!errors.paymentDate} {...register("paymentDate")} />
            {errors.paymentDate ? <p role="alert" className="text-xs text-destructive">{errors.paymentDate.message}</p> : null}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="paymentAmount">Amount (₱)</Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => setValue("amount", maxAmount, { shouldValidate: true })}
              >
                Pay in full
              </Button>
            </div>
            <Input
              id="paymentAmount"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              aria-invalid={!!errors.amount}
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount ? <p role="alert" className="text-xs text-destructive">{errors.amount.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentNotes">Notes (optional)</Label>
            <Textarea id="paymentNotes" rows={2} aria-invalid={!!errors.notes} {...register("notes")} />
            {errors.notes ? <p role="alert" className="text-xs text-destructive">{errors.notes.message}</p> : null}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              {payment ? "Save changes" : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
