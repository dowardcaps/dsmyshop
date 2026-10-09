"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createDebtAction, updateDebtAction } from "@/lib/actions/debts";
import { debtInputSchema, type DebtInput } from "@/lib/validation/debt";

interface UseDebtFormOptions {
  defaultValues: DebtInput;
  /** When set, the form edits this debt instead of creating a new one. */
  debtId?: string;
  /** Where to go after saving (the Records page, dialog closed). */
  returnHref: string;
}

export function useDebtForm({ defaultValues, debtId, returnHref }: UseDebtFormOptions) {
  const router = useRouter();
  const form = useForm<DebtInput>({ resolver: zodResolver(debtInputSchema), defaultValues });

  const submit = form.handleSubmit(async (values) => {
    const result = debtId ? await updateDebtAction(debtId, values) : await createDebtAction(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(debtId ? "Debt updated." : "Debt saved.");
    router.replace(returnHref, { scroll: false });
    router.refresh();
  });

  return { form, submit };
}
