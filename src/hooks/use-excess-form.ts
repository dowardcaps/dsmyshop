"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createExcessAction, updateExcessAction } from "@/lib/actions/excess";
import { excessInputSchema, type ExcessInput } from "@/lib/validation/excess";

interface UseExcessFormOptions {
  defaultValues: ExcessInput;
  /** When set, the form edits this record instead of creating a new one. */
  excessId?: string;
  /** Where to go after saving (the Records page, dialog closed). */
  returnHref: string;
}

export function useExcessForm({ defaultValues, excessId, returnHref }: UseExcessFormOptions) {
  const router = useRouter();
  const form = useForm<ExcessInput>({ resolver: zodResolver(excessInputSchema), defaultValues });

  const submit = form.handleSubmit(async (values) => {
    const result = excessId ? await updateExcessAction(excessId, values) : await createExcessAction(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(excessId ? "Record updated." : "Record saved.");
    router.replace(returnHref, { scroll: false });
    router.refresh();
  });

  return { form, submit };
}
