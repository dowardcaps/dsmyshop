"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { changePasswordAction } from "@/lib/actions/settings";
import { passwordSchema, type PasswordInput } from "@/lib/validation/settings";

const EMPTY: PasswordInput = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function usePasswordForm() {
  const form = useForm<PasswordInput>({ resolver: zodResolver(passwordSchema), defaultValues: EMPTY });

  const submit = form.handleSubmit(async (values) => {
    const result = await changePasswordAction(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Password changed.");
    form.reset(EMPTY);
  });

  return { form, submit };
}
