"use server";

import { revalidatePath } from "next/cache";

import { actionFailure } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { requireUser } from "@/lib/auth/require-user";
import { changePassword, createEmployee, deleteEmployee, updateEmployee, updateProfile } from "@/lib/settings/service";
import { employeeInputSchema, passwordSchema, profileSchema } from "@/lib/validation/settings";

const INVALID = "Please check the highlighted fields.";

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID };
  try {
    await updateProfile(user.id, parsed.data);
    revalidatePath("/", "layout");
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(error, "Could not save your name. Please try again.");
  }
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID };
  try {
    await changePassword(user.id, parsed.data);
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(error, "Could not change the password. Please try again.");
  }
}

function refreshSalary() {
  revalidatePath("/settings");
  revalidatePath("/records");
  revalidatePath("/dashboard");
}

export async function createEmployeeAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = employeeInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID };
  try {
    await createEmployee(user.id, parsed.data);
    refreshSalary();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(error, "Could not add the employee. Please try again.");
  }
}

export async function updateEmployeeAction(id: string, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = employeeInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID };
  try {
    await updateEmployee(user.id, id, parsed.data);
    refreshSalary();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(error, "Could not update the employee. Please try again.");
  }
}

export async function deleteEmployeeAction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await deleteEmployee(user.id, id);
    refreshSalary();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(error, "Could not delete the employee. Please try again.");
  }
}
