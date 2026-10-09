"use server";

import { revalidatePath } from "next/cache";

import { actionFailure } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { requireUser } from "@/lib/auth/require-user";
import {
  createGcashTransaction,
  deleteGcashTransaction,
  updateGcashTransaction,
} from "@/lib/gcash/service";
import { gcashInputSchema } from "@/lib/validation/gcash";

function refresh() {
  revalidatePath("/gcash");
  revalidatePath("/records");
  revalidatePath("/dashboard");
}

export async function createGcashAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = gcashInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." };

  try {
    const id = await createGcashTransaction(user.id, parsed.data);
    refresh();
    return { ok: true, data: { id } };
  } catch (error) {
    return actionFailure(error, "Could not save the transaction. Please try again.");
  }
}

export async function updateGcashAction(id: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = gcashInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." };

  try {
    await updateGcashTransaction(user.id, id, parsed.data);
    refresh();
    return { ok: true, data: { id } };
  } catch (error) {
    return actionFailure(error, "Could not update the transaction. Please try again.");
  }
}

export async function deleteGcashAction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await deleteGcashTransaction(user.id, id);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(error, "Could not delete the transaction. Please try again.");
  }
}
