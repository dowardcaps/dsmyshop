"use server";

import { revalidatePath } from "next/cache";

import { actionFailure } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { requireUser } from "@/lib/auth/require-user";
import { createDebt, deleteDebt, deletePayment, recordPayment, updateDebt, updatePayment } from "@/lib/debts/service";
import { debtInputSchema, debtPaymentInputSchema } from "@/lib/validation/debt";

function refresh(debtId?: string) {
  revalidatePath("/debts");
  revalidatePath("/records");
  if (debtId) revalidatePath(`/debts/${debtId}`);
  revalidatePath("/dashboard");
}

const INVALID = { ok: false, error: "Please check the highlighted fields." } as const;

export async function createDebtAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = debtInputSchema.safeParse(input);
  if (!parsed.success) return INVALID;
  try {
    const id = await createDebt(user.id, parsed.data);
    refresh();
    return { ok: true, data: { id } };
  } catch (error) {
    return actionFailure(error, "Could not save the debt. Please try again.");
  }
}

export async function updateDebtAction(debtId: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = debtInputSchema.safeParse(input);
  if (!parsed.success) return INVALID;
  try {
    await updateDebt(user.id, debtId, parsed.data);
    refresh(debtId);
    return { ok: true, data: { id: debtId } };
  } catch (error) {
    return actionFailure(error, "Could not update the debt. Please try again.");
  }
}

export async function deleteDebtAction(debtId: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await deleteDebt(user.id, debtId);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(error, "Could not delete the debt. Please try again.");
  }
}

export async function recordPaymentAction(debtId: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = debtPaymentInputSchema.safeParse(input);
  if (!parsed.success) return INVALID;
  try {
    const id = await recordPayment(user.id, debtId, parsed.data);
    refresh(debtId);
    return { ok: true, data: { id } };
  } catch (error) {
    return actionFailure(error, "Could not record the payment. Please try again.");
  }
}

export async function updatePaymentAction(
  debtId: string,
  paymentId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = debtPaymentInputSchema.safeParse(input);
  if (!parsed.success) return INVALID;
  try {
    await updatePayment(user.id, debtId, paymentId, parsed.data);
    refresh(debtId);
    return { ok: true, data: { id: paymentId } };
  } catch (error) {
    return actionFailure(error, "Could not update the payment. Please try again.");
  }
}

export async function deletePaymentAction(debtId: string, paymentId: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await deletePayment(user.id, debtId, paymentId);
    refresh(debtId);
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(error, "Could not delete the payment. Please try again.");
  }
}
