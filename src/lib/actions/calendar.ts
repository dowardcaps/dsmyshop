"use server";

import { revalidatePath } from "next/cache";

import { actionFailure } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { requireUser } from "@/lib/auth/require-user";
import { clearShopDays, setShopDays } from "@/lib/calendar/service";
import {
  clearRangeSchema,
  shopDayInputSchema,
} from "@/lib/validation/calendar";

export async function setShopDaysAction(
  input: unknown,
): Promise<ActionResult<{ days: number }>> {
  const user = await requireUser();
  const parsed = shopDayInputSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Please check the highlighted fields." };
  try {
    const days = await setShopDays(user.id, parsed.data);
    revalidatePath("/calendar");
    return { ok: true, data: { days } };
  } catch (error) {
    return actionFailure(error, "Could not save. Please try again.");
  }
}

export async function clearShopDaysAction(
  input: unknown,
): Promise<ActionResult<{ days: number }>> {
  const user = await requireUser();
  const parsed = clearRangeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid date range." };
  try {
    const days = await clearShopDays(
      user.id,
      parsed.data.fromDate,
      parsed.data.toDate,
    );
    revalidatePath("/calendar");
    return { ok: true, data: { days } };
  } catch (error) {
    return actionFailure(error, "Could not clear. Please try again.");
  }
}
