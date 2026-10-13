"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { updateProfileAction } from "@/lib/actions/settings";
import { profileSchema, type ProfileInput } from "@/lib/validation/settings";

export function useProfileForm(defaultName: string) {
  const router = useRouter();
  const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: { name: defaultName } });

  const submit = form.handleSubmit(async (values) => {
    const result = await updateProfileAction(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Name updated.");
    form.reset(values);
    router.refresh();
  });

  return { form, submit };
}
