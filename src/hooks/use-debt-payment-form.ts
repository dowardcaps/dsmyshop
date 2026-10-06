"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { recordPaymentAction, updatePaymentAction } from "@/lib/actions/debts";
import { todayInManila, toDateInputValue } from "@/lib/dates";
import { debtPaymentInputSchema, type DebtPaymentInput } from "@/lib/validation/debt";

interface UseDebtPaymentFormOptions {
  debtId: string;
  /** When set, the form edits this payment instead of recording a new one. */
  payment?: { id: string; paymentDate: Date; amount: number; notes: string | null };
  onSaved: () => void;
}

export function useDebtPaymentForm({ debtId, payment, onSaved }: UseDebtPaymentFormOptions) {
  const router = useRouter();

  const initialValues = (): DebtPaymentInput =>
    payment
      ? { paymentDate: toDateInputValue(payment.paymentDate), amount: payment.amount, notes: payment.notes ?? "" }
      : { paymentDate: todayInManila(), amount: Number.NaN, notes: "" };

  const form = useForm<DebtPaymentInput>({ resolver: zodResolver(debtPaymentInputSchema), defaultValues: initialValues() });

  const submit = form.handleSubmit(async (values) => {
    const result = payment
      ? await updatePaymentAction(debtId, payment.id, values)
      : await recordPaymentAction(debtId, values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(payment ? "Payment updated." : "Payment recorded.");
    onSaved();
    router.refresh();
  });

  return { form, submit, resetForm: () => form.reset(initialValues()) };
}
