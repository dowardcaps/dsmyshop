"use server";

import { revalidatePath } from "next/cache";

import { actionFailure } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { requireUser } from "@/lib/auth/require-user";
import { createInventoryItem, deleteInventoryItem, importStationeryFromPriceList, updateInventoryItem } from "@/lib/inventory/service";
import { inventoryInputSchema } from "@/lib/validation/inventory";

function refresh() {
  revalidatePath("/inventory");
}

export async function createInventoryAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = inventoryInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." };

  try {
    const id = await createInventoryItem(user.id, parsed.data);
    refresh();
    return { ok: true, data: { id } };
  } catch (error) {
    return actionFailure(error, "Could not save the item. Please try again.");
  }
}

export async function updateInventoryAction(id: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = inventoryInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." };

  try {
    await updateInventoryItem(user.id, id, parsed.data);
    refresh();
    return { ok: true, data: { id } };
  } catch (error) {
    return actionFailure(error, "Could not update the item. Please try again.");
  }
}

export async function deleteInventoryAction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await deleteInventoryItem(user.id, id);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(error, "Could not delete the item. Please try again.");
  }
}

export async function importStationeryAction(): Promise<ActionResult<{ added: number }>> {
  const user = await requireUser();
  try {
    const added = await importStationeryFromPriceList(user.id);
    refresh();
    return { ok: true, data: { added } };
  } catch (error) {
    return actionFailure(error, "Could not add the stationery items. Please try again.");
  }
}
