"use server";

import { revalidatePath } from "next/cache";

import { actionFailure } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { requireUser } from "@/lib/auth/require-user";
import { createShort, deleteShort, updateShort } from "@/lib/short/service";
import { shortInputSchema } from "@/lib/validation/short";

function refresh() {
  revalidatePath("/records");
}

export async function createShortAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = shortInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." };

  try {
    const id = await createShort(user.id, parsed.data);
    refresh();
    return { ok: true, data: { id } };
  } catch (error) {
    return actionFailure(error, "Could not save the record. Please try again.");
  }
}

export async function updateShortAction(id: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = shortInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." };

  try {
    await updateShort(user.id, id, parsed.data);
    refresh();
    return { ok: true, data: { id } };
  } catch (error) {
    return actionFailure(error, "Could not update the record. Please try again.");
  }
}

export async function deleteShortAction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await deleteShort(user.id, id);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(error, "Could not delete the record. Please try again.");
  }
}
