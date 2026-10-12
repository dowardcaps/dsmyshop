"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { cashOutFee } from "@/lib/gcash/fee";
import { createGcashAction, updateGcashAction } from "@/lib/actions/gcash";
import { gcashInputSchema, type GcashInput } from "@/lib/validation/gcash";

interface UseGcashFormOptions {
  defaultValues: GcashInput;
  /** When set, the form edits this transaction instead of creating a new one. */
  transactionId?: string;
  /** Where to go after saving (the Records page, dialog closed). */
  returnHref: string;
}

export function useGcashForm({ defaultValues, transactionId, returnHref }: UseGcashFormOptions) {
  const router = useRouter();
  const form = useForm<GcashInput>({ resolver: zodResolver(gcashInputSchema), defaultValues });
  const [amount, charge] = useWatch({ control: form.control, name: ["amount", "charge"] });

  // Reading dirtyFields subscribes this hook to it: once the owner types a charge, it is never overwritten.
  const chargeEdited = Boolean(form.formState.dirtyFields.charge);

  /** Cash Out: fill in the fee from the Sales.xlsx fee table, until the owner types their own. */
  const suggestCharge = (type: string, rawAmount: number) => {
    if (chargeEdited || type !== "CASH_OUT") return;
    const fee = cashOutFee(rawAmount);
    if (fee !== null) form.setValue("charge", fee);
  };

  const submit = form.handleSubmit(async (values) => {
    const result = transactionId ? await updateGcashAction(transactionId, values) : await createGcashAction(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(transactionId ? "Transaction updated." : "Transaction saved.");
    router.replace(returnHref, { scroll: false });
    router.refresh();
  });

  return {
    form,
    submit,
    suggestCharge,
    /** What the customer pays or receives in total, shown as a hint only. */
    amountHint: Number.isFinite(amount) ? amount : 0,
    chargeHint: Number.isFinite(charge) ? charge : 0,
  };
}
