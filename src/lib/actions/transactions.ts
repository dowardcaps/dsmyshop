"use server";

import { revalidatePath } from "next/cache";

import { actionFailure } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { requireUser } from "@/lib/auth/require-user";
import {
  createService,
  deleteService,
  resetServicesToDefault,
  updateService,
} from "@/lib/transactions/catalog";
import { recordCheckout, type CheckoutResult } from "@/lib/transactions/checkout";
import { checkoutInputSchema, serviceInputSchema } from "@/lib/validation/transaction";

/** Saves a calculator cart as a Sale. /sales and /dashboard show it right away. */
export async function checkoutAction(input: unknown): Promise<ActionResult<CheckoutResult>> {
  const user = await requireUser();
  const parsed = checkoutInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the cart." };

  try {
    const result = await recordCheckout(user.id, parsed.data);
    revalidatePath("/sales");
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    return { ok: true, data: result };
  } catch (error) {
    return actionFailure(error, "Could not save the sale. Please try again.");
  }
}

function refreshServices() {
  revalidatePath("/transactions");
  revalidatePath("/transactions/services");
}

export async function createServiceAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = serviceInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." };
  try {
    const id = await createService(user.id, parsed.data);
    refreshServices();
    return { ok: true, data: { id } };
  } catch (error) {
    return actionFailure(error, "Could not add the service. Please try again.");
  }
}

export async function updateServiceAction(serviceId: string, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = serviceInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." };
  try {
    await updateService(user.id, serviceId, parsed.data);
    refreshServices();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(error, "Could not update the service. Please try again.");
  }
}

export async function deleteServiceAction(serviceId: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await deleteService(user.id, serviceId);
    refreshServices();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(error, "Could not delete the service. Please try again.");
  }
}

export async function resetServicesAction(): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await resetServicesToDefault(user.id);
    refreshServices();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(error, "Could not reset the service list. Please try again.");
  }
}
