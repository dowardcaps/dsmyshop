"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { setGcashBalanceAction } from "@/lib/actions/gcash-balance";
import { formatPeso } from "@/lib/format";
import {
  gcashBalanceSchema,
  type GcashBalanceInput,
} from "@/lib/validation/gcash-balance";

export function useGcashBalanceForm({
  currentBalance,
  onSaved,
}: {
  currentBalance?: number;
  onSaved: () => void;
}) {
  const router = useRouter();
  const form = useForm<GcashBalanceInput>({
    resolver: zodResolver(gcashBalanceSchema),
    defaultValues: { balance: currentBalance as number },
  });

  const submit = form.handleSubmit(async (values) => {
    const result = await setGcashBalanceAction(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const diff = result.data.differenceCents;
    if (diff === null || diff === 0) toast.success("GCash balance saved.");
    else
      toast.warning(
        `Saved. The system was ${formatPeso(Math.abs(diff) / 100)} ${diff > 0 ? "lower" : "higher"} than the app, so some transactions may be missing or wrong.`,
      );
    onSaved();
    router.refresh();
  });

  return { form, submit };
}
