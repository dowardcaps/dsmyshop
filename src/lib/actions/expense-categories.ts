"use server";

import { revalidatePath } from "next/cache";

import { actionFailure } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { requireUser } from "@/lib/auth/require-user";
import {
  createExpenseCategory,
  deleteExpenseCategory,
  updateExpenseCategory,
} from "@/lib/expenses/category-service";
import { expenseCategoryInputSchema } from "@/lib/validation/expense";

function refresh() {
  revalidatePath("/expenses", "layout");
  revalidatePath("/records");
}

export async function createExpenseCategoryAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = expenseCategoryInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." };

  try {
    const id = await createExpenseCategory(user.id, parsed.data);
    refresh();
    return { ok: true, data: { id } };
  } catch (error) {
    return actionFailure(error, "Could not save the category. Please try again.");
  }
}

export async function updateExpenseCategoryAction(id: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = expenseCategoryInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." };

  try {
    await updateExpenseCategory(user.id, id, parsed.data);
    refresh();
    return { ok: true, data: { id } };
  } catch (error) {
    return actionFailure(error, "Could not update the category. Please try again.");
  }
}

export async function deleteExpenseCategoryAction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await deleteExpenseCategory(user.id, id);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(error, "Could not delete the category. Please try again.");
  }
}
