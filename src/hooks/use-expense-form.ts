"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createExpenseAction, updateExpenseAction } from "@/lib/actions/expenses";
import { expenseInputSchema, type ExpenseInput } from "@/lib/validation/expense";

interface UseExpenseFormOptions {
  defaultValues: ExpenseInput;
  /** When set, the form edits this expense instead of creating a new one. */
  expenseId?: string;
}

export function useExpenseForm({ defaultValues, expenseId }: UseExpenseFormOptions) {
  const router = useRouter();
  const form = useForm<ExpenseInput>({ resolver: zodResolver(expenseInputSchema), defaultValues });

  const submit = form.handleSubmit(async (values) => {
    const result = expenseId ? await updateExpenseAction(expenseId, values) : await createExpenseAction(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(expenseId ? "Expense updated." : "Expense saved.");
    router.push("/expenses");
    router.refresh();
  });

  return { form, submit };
}
