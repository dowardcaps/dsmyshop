"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { createAdvanceAction, updateAdvanceAction } from "@/lib/actions/salary";
import type { PeriodOption } from "@/lib/salary/queries";
import { advanceInputSchema, type AdvanceInput } from "@/lib/validation/salary";

interface UseAdvanceFormOptions {
  defaultValues: AdvanceInput;
  periods: PeriodOption[];
  advanceId?: string;
  returnHref: string;
}

export function useAdvanceForm({ defaultValues, periods, advanceId, returnHref }: UseAdvanceFormOptions) {
  const router = useRouter();
  const form = useForm<AdvanceInput>({ resolver: zodResolver(advanceInputSchema), defaultValues });
  const employeeId = useWatch({ control: form.control, name: "employeeId" });
  const periodId = useWatch({ control: form.control, name: "periodId" });

  /** Only this employee's unpaid pay dates can take an advance. */
  const employeePeriods = useMemo(() => periods.filter((p) => p.employeeId === employeeId), [periods, employeeId]);
  const selectedPeriod = employeePeriods.find((p) => p.id === periodId);

  /** Changing the employee picks that employee's earliest unpaid pay date. */
  const onEmployeeChange = (nextEmployeeId: string) => {
    const first = periods.find((p) => p.employeeId === nextEmployeeId);
    form.setValue("periodId", first?.id ?? "", { shouldValidate: false });
  };

  const submit = form.handleSubmit(async (values) => {
    const result = advanceId ? await updateAdvanceAction(advanceId, values) : await createAdvanceAction(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(advanceId ? "Cash advance updated." : "Cash advance saved.");
    router.replace(returnHref, { scroll: false });
    router.refresh();
  });

  return { form, submit, employeePeriods, selectedPeriod, onEmployeeChange };
}
