"use server";

import { revalidatePath } from "next/cache";

import { actionFailure } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { requireUser } from "@/lib/auth/require-user";
import { setGcashBalance } from "@/lib/gcash/balance-service";
import { gcashBalanceSchema } from "@/lib/validation/gcash-balance";

export async function setGcashBalanceAction(
  input: unknown,
): Promise<ActionResult<{ differenceCents: number | null }>> {
  const user = await requireUser();
  const parsed = gcashBalanceSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Enter the balance shown in the GCash app." };
  try {
    const result = await setGcashBalance(user.id, parsed.data.balance);
    revalidatePath("/records");
    return { ok: true, data: result };
  } catch (error) {
    return actionFailure(
      error,
      "Could not save the balance. Please try again.",
    );
  }
}
