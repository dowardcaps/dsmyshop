"use server";

import { revalidatePath } from "next/cache";

import { actionFailure } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { requireUser } from "@/lib/auth/require-user";
import { createReimbursement, deleteReimbursement, updateReimbursement } from "@/lib/reimbursement/service";
import { reimbursementInputSchema } from "@/lib/validation/reimbursement";

function refresh() {
  revalidatePath("/records");
}

export async function createReimbursementAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = reimbursementInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." };

  try {
    const id = await createReimbursement(user.id, parsed.data);
    refresh();
    return { ok: true, data: { id } };
  } catch (error) {
    return actionFailure(error, "Could not save the record. Please try again.");
  }
}

export async function updateReimbursementAction(id: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = reimbursementInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." };

  try {
    await updateReimbursement(user.id, id, parsed.data);
    refresh();
    return { ok: true, data: { id } };
  } catch (error) {
    return actionFailure(error, "Could not update the record. Please try again.");
  }
}

export async function deleteReimbursementAction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await deleteReimbursement(user.id, id);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(error, "Could not delete the record. Please try again.");
  }
}
