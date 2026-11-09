"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { updatePerformanceSettingsAction } from "@/lib/actions/performance";
import type { PerformanceSettings } from "@/lib/performance/service";
import {
  performanceSettingsSchema,
  type PerformanceSettingsInput,
} from "@/lib/validation/performance";

export function usePerformanceSettingsForm(settings: PerformanceSettings) {
  const router = useRouter();
  const form = useForm<PerformanceSettingsInput>({
    resolver: zodResolver(performanceSettingsSchema),
    defaultValues: {
      operatingDays: settings.operatingDays,
      minDailyTarget: settings.minDailyTargetCents / 100,
      dailyTarget: settings.dailyTargetCents / 100,
      growthTarget: settings.growthTargetCents / 100,
      variableCostPct: settings.variableCostPct,
    },
  });

  const submit = form.handleSubmit(async (values) => {
    // Targets and operating days change every figure on the page, so ask first.
    if (
      !window.confirm(
        "Apply these targets and assumptions? Dashboard figures, targets and break-even will recalculate. Recorded transactions are not changed.",
      )
    )
      return;
    const result = await updatePerformanceSettingsAction(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Settings saved.");
    router.refresh();
  });

  return { form, submit };
}
