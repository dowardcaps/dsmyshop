"use server";

import { revalidatePath } from "next/cache";

import { actionFailure } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { requireUser } from "@/lib/auth/require-user";
import { createAdvance, deleteAdvance, updateAdvance } from "@/lib/salary/service";
import { advanceInputSchema } from "@/lib/validation/salary";

const refresh = () => revalidatePath("/records");

export async function createAdvanceAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = advanceInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." };
  try {
    const id = await createAdvance(user.id, parsed.data);
    refresh();
    return { ok: true, data: { id } };
  } catch (error) {
    return actionFailure(error, "Could not save the cash advance. Please try again.");
  }
}

export async function updateAdvanceAction(id: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = advanceInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." };
  try {
    await updateAdvance(user.id, id, parsed.data);
    refresh();
    return { ok: true, data: { id } };
  } catch (error) {
    return actionFailure(error, "Could not update the cash advance. Please try again.");
  }
}

export async function deleteAdvanceAction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await deleteAdvance(user.id, id);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(error, "Could not delete the cash advance. Please try again.");
  }
}
