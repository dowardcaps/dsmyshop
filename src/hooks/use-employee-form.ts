"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createEmployeeAction, updateEmployeeAction } from "@/lib/actions/settings";
import { todayInManila } from "@/lib/dates";
import { employeeInputSchema, type EmployeeInput } from "@/lib/validation/settings";

export interface EditableEmployee {
  id: string;
  name: string;
  monthlySalaryCents: number;
  startMonth: string;
}

export const employeeDefaults = (employee?: EditableEmployee): EmployeeInput => ({
  name: employee?.name ?? "",
  monthlySalary: employee ? employee.monthlySalaryCents / 100 : (undefined as unknown as number),
  startMonth: employee?.startMonth ?? todayInManila().slice(0, 7),
});

export function useEmployeeForm({ employee, onSaved }: { employee?: EditableEmployee; onSaved: () => void }) {
  const router = useRouter();
  const form = useForm<EmployeeInput>({ resolver: zodResolver(employeeInputSchema), defaultValues: employeeDefaults(employee) });

  const submit = form.handleSubmit(async (values) => {
    const result = employee ? await updateEmployeeAction(employee.id, values) : await createEmployeeAction(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(employee ? "Employee updated." : "Employee added.");
    onSaved();
    router.refresh();
  });

  return { form, submit };
}
