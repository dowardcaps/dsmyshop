"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdvanceForm } from "@/hooks/use-advance-form";
import { parseDateInput } from "@/lib/dates";
import { formatDate, formatPeso } from "@/lib/format";
import type { EmployeeOption, PeriodOption } from "@/lib/salary/queries";
import type { AdvanceInput } from "@/lib/validation/salary";

interface AdvanceFormProps {
  defaultValues: AdvanceInput;
  employees: EmployeeOption[];
  periods: PeriodOption[];
  advanceId?: string;
  returnHref: string;
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

export function AdvanceForm({ defaultValues, employees, periods, advanceId, returnHref }: AdvanceFormProps) {
  const { form, submit, employeePeriods, selectedPeriod, onEmployeeChange } = useAdvanceForm({ defaultValues, periods, advanceId, returnHref });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="advanceEmployee">Employee</Label>
            <Select id="advanceEmployee" aria-invalid={!!errors.employeeId} {...register("employeeId", { onChange: (e) => onEmployeeChange(e.target.value) })}>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </Select>
            <FieldError message={errors.employeeId?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="advancePeriod">Deduct from</Label>
            <Select id="advancePeriod" aria-invalid={!!errors.periodId} {...register("periodId")}>
              {employeePeriods.length === 0 ? <option value="">No unpaid pay date</option> : null}
              {employeePeriods.map((period) => (
                <option key={period.id} value={period.id}>
                  {formatDate(parseDateInput(period.payDate))} · {formatPeso(period.roomCents / 100)} left
                </option>
              ))}
            </Select>
            <FieldError message={errors.periodId?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="advanceAmount">Amount (₱)</Label>
            <Input id="advanceAmount" type="number" inputMode="decimal" min={0} step="0.01" aria-invalid={!!errors.amount} aria-describedby="advance-help" {...register("amount", { valueAsNumber: true })} />
            <p id="advance-help" className="text-xs text-muted-foreground">
              {selectedPeriod ? `Up to ${formatPeso(selectedPeriod.roomCents / 100)} can be advanced on this pay date.` : "Taken out of the salary on the chosen pay date."}
            </p>
            <FieldError message={errors.amount?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="advanceDate">Date given</Label>
            <Input id="advanceDate" type="date" aria-invalid={!!errors.advanceDate} {...register("advanceDate")} />
            <FieldError message={errors.advanceDate?.message} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="advanceNotes">Notes (optional)</Label>
            <Textarea id="advanceNotes" rows={2} aria-invalid={!!errors.notes} {...register("notes")} />
            <FieldError message={errors.notes?.message} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button asChild variant="ghost">
          <Link href={returnHref}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {advanceId ? "Save changes" : "Save cash advance"}
        </Button>
      </div>
    </form>
  );
}
