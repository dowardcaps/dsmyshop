"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { createGcashAction, updateGcashAction } from "@/lib/actions/gcash";
import { gcashInputSchema, type GcashInput } from "@/lib/validation/gcash";

interface UseGcashFormOptions {
  defaultValues: GcashInput;
  /** When set, the form edits this transaction instead of creating a new one. */
  transactionId?: string;
}

export function useGcashForm({ defaultValues, transactionId }: UseGcashFormOptions) {
  const router = useRouter();
  const form = useForm<GcashInput>({ resolver: zodResolver(gcashInputSchema), defaultValues });
  const [amount, charge] = useWatch({ control: form.control, name: ["amount", "charge"] });

  const submit = form.handleSubmit(async (values) => {
    const result = transactionId ? await updateGcashAction(transactionId, values) : await createGcashAction(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(transactionId ? "Transaction updated." : "Transaction saved.");
    router.push("/gcash");
    router.refresh();
  });

  return {
    form,
    submit,
    /** What the customer pays or receives in total, shown as a hint only. */
    amountHint: Number.isFinite(amount) ? amount : 0,
    chargeHint: Number.isFinite(charge) ? charge : 0,
  };
}
