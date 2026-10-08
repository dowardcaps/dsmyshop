"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createServiceAction, updateServiceAction } from "@/lib/actions/transactions";
import { serviceInputSchema, type ServiceInput } from "@/lib/validation/transaction";

interface UseServiceFormOptions {
  defaultValues: ServiceInput;
  /** When set, the form edits this service instead of adding a new one. */
  serviceId?: string;
  onDone: () => void;
}

export function useServiceForm({ defaultValues, serviceId, onDone }: UseServiceFormOptions) {
  const router = useRouter();
  const form = useForm<ServiceInput>({ resolver: zodResolver(serviceInputSchema), defaultValues });

  const submit = form.handleSubmit(async (values) => {
    const result = serviceId ? await updateServiceAction(serviceId, values) : await createServiceAction(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(serviceId ? "Service updated." : "Service added.");
    onDone();
    router.refresh();
  });

  return { form, submit };
}
