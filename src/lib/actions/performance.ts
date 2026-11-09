"use server";

import { revalidatePath } from "next/cache";

import { actionFailure } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { requireUser } from "@/lib/auth/require-user";
import {
  EXPENSE_KINDS,
  type ExpenseKindValue,
} from "@/lib/performance/constants";
import {
  addFixedExpense,
  changeFixedExpense,
  endFixedExpense,
  setCategoryKind,
  updateSettings,
} from "@/lib/performance/service";
import {
  fixedExpenseSchema,
  monthParamSchema,
  performanceSettingsSchema,
} from "@/lib/validation/performance";

const refresh = () => revalidatePath("/performance");
const invalid = {
  ok: false,
  error: "Please check the highlighted fields.",
} as const;

export async function updatePerformanceSettingsAction(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = performanceSettingsSchema.safeParse(input);
  if (!parsed.success) return invalid;
  try {
    await updateSettings(user.id, parsed.data);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(
      error,
      "Could not save the settings. Please try again.",
    );
  }
}

export async function addFixedExpenseAction(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = fixedExpenseSchema.safeParse(input);
  if (!parsed.success) return invalid;
  try {
    await addFixedExpense(user.id, parsed.data);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(
      error,
      "Could not save the fixed cost. Please try again.",
    );
  }
}

export async function changeFixedExpenseAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = fixedExpenseSchema.safeParse(input);
  if (!parsed.success) return invalid;
  try {
    await changeFixedExpense(user.id, id, parsed.data);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(
      error,
      "Could not update the fixed cost. Please try again.",
    );
  }
}

export async function endFixedExpenseAction(
  id: string,
  fromMonth: string,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!monthParamSchema.safeParse(fromMonth).success) return invalid;
  try {
    await endFixedExpense(user.id, id, fromMonth);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(
      error,
      "Could not remove the fixed cost. Please try again.",
    );
  }
}

export async function setCategoryKindAction(
  categoryId: string,
  kind: string,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!(EXPENSE_KINDS as readonly string[]).includes(kind)) return invalid;
  try {
    await setCategoryKind(user.id, categoryId, kind as ExpenseKindValue);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(
      error,
      "Could not change the category. Please try again.",
    );
  }
}
