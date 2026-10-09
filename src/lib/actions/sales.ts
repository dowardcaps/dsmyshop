"use server";

import { revalidatePath } from "next/cache";

import { actionFailure } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { requireUser } from "@/lib/auth/require-user";
import { createSale, deleteSale, updateSale } from "@/lib/sales/service";
import { saleInputSchema } from "@/lib/validation/sale";

function refresh() {
  revalidatePath("/sales");
  revalidatePath("/records");
  revalidatePath("/dashboard");
}

export async function createSaleAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = saleInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." };

  try {
    const id = await createSale(user.id, parsed.data);
    refresh();
    return { ok: true, data: { id } };
  } catch (error) {
    return actionFailure(error, "Could not save the sale. Please try again.");
  }
}

export async function updateSaleAction(saleId: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = saleInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." };

  try {
    const id = await updateSale(user.id, saleId, parsed.data);
    refresh();
    revalidatePath(`/sales/${id}`);
    return { ok: true, data: { id } };
  } catch (error) {
    return actionFailure(error, "Could not update the sale. Please try again.");
  }
}

export async function deleteSaleAction(saleId: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await deleteSale(user.id, saleId);
    refresh();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(error, "Could not delete the sale. Please try again.");
  }
}
