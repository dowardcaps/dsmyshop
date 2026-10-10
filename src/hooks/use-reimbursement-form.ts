"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createReimbursementAction, updateReimbursementAction } from "@/lib/actions/reimbursement";
import { reimbursementInputSchema, type ReimbursementInput } from "@/lib/validation/reimbursement";

interface UseReimbursementFormOptions {
  defaultValues: ReimbursementInput;
  /** When set, the form edits this record instead of creating a new one. */
  reimbursementId?: string;
  /** Where to go after saving (the Records page, dialog closed). */
  returnHref: string;
}

export function useReimbursementForm({ defaultValues, reimbursementId, returnHref }: UseReimbursementFormOptions) {
  const router = useRouter();
  const form = useForm<ReimbursementInput>({ resolver: zodResolver(reimbursementInputSchema), defaultValues });

  const submit = form.handleSubmit(async (values) => {
    const result = reimbursementId ? await updateReimbursementAction(reimbursementId, values) : await createReimbursementAction(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(reimbursementId ? "Record updated." : "Record saved.");
    router.replace(returnHref, { scroll: false });
    router.refresh();
  });

  return { form, submit };
}
