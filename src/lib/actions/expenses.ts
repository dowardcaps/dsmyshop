"use server";

import { revalidatePath } from "next/cache";

import { actionFailure } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { requireUser } from "@/lib/auth/require-user";
import { createExpense, deleteExpense, updateExpense } from "@/lib/expenses/service";
import { expenseInputSchema } from "@/lib/validation/expense";

function refresh() {
  revalidatePath("/expenses");
  revalidatePath("/records");
  revalidatePath("/dashboard");
}

export async function createExpenseAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = expenseInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." };

  try {
    const id = await createExpense(user.id, parsed.data);
    refresh();
    return { ok: true, data: { id } };
  } catch (error) {
    return actionFailure(error, "Could not save the expense. Please try again.");
  }
}

export async function updateExpenseAction(id: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = expenseInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." };

  try {
    await updateExpense(user.id, id, parsed.data);
    refresh();
    return { ok: true, data: { id } };
  } catch (error) {
    return actionFailure(error, "Could not update the expense. Please try again.");
  }
}

export async function deleteExpenseAction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await deleteExpense(user.id, id);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(error, "Could not delete the expense. Please try again.");
  }
}
