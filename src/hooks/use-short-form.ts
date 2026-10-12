"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createShortAction, updateShortAction } from "@/lib/actions/short";
import { shortInputSchema, type ShortInput } from "@/lib/validation/short";

interface UseShortFormOptions {
  defaultValues: ShortInput;
  /** When set, the form edits this record instead of creating a new one. */
  shortId?: string;
  /** Where to go after saving (the Records page, dialog closed). */
  returnHref: string;
}

export function useShortForm({ defaultValues, shortId, returnHref }: UseShortFormOptions) {
  const router = useRouter();
  const form = useForm<ShortInput>({ resolver: zodResolver(shortInputSchema), defaultValues });

  const submit = form.handleSubmit(async (values) => {
    const result = shortId ? await updateShortAction(shortId, values) : await createShortAction(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(shortId ? "Record updated." : "Record saved.");
    router.replace(returnHref, { scroll: false });
    router.refresh();
  });

  return { form, submit };
}
