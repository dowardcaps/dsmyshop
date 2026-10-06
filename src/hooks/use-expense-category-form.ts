"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createExpenseCategoryAction, updateExpenseCategoryAction } from "@/lib/actions/expense-categories";
import { expenseCategoryInputSchema, type ExpenseCategoryInput } from "@/lib/validation/expense";

interface UseExpenseCategoryFormOptions {
  /** When set, the form renames/edits this category instead of creating one. */
  category?: { id: string; name: string; description: string | null };
  onSaved: () => void;
}

export function useExpenseCategoryForm({ category, onSaved }: UseExpenseCategoryFormOptions) {
  const router = useRouter();
  const form = useForm<ExpenseCategoryInput>({
    resolver: zodResolver(expenseCategoryInputSchema),
    defaultValues: { name: category?.name ?? "", description: category?.description ?? "" },
  });

  const submit = form.handleSubmit(async (values) => {
    const result = category ? await updateExpenseCategoryAction(category.id, values) : await createExpenseCategoryAction(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(category ? "Category updated." : "Category added.");
    if (!category) form.reset({ name: "", description: "" });
    onSaved();
    router.refresh();
  });

  return { form, submit };
}
