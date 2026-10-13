"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { employeeDefaults, useEmployeeForm, type EditableEmployee } from "@/hooks/use-employee-form";

interface EmployeeDialogProps {
  /** Omit to add a new employee. */
  employee?: EditableEmployee;
  children: React.ReactNode;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p role="alert" className="text-xs text-destructive">{message}</p> : null;
}

export function EmployeeDialog({ employee, children }: EmployeeDialogProps) {
  const [open, setOpen] = useState(false);
  const { form, submit } = useEmployeeForm({ employee, onSaved: () => setOpen(false) });
  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset(employeeDefaults(employee));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{employee ? "Edit employee" : "Add employee"}</DialogTitle>
            <DialogDescription>
              {employee
                ? "A new salary applies to unpaid pay dates without advances. Paid or advanced pay dates keep their amount."
                : "Salary is paid on the 15th and 30th, starting from the month you pick."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="employee-name">Name</Label>
            <Input id="employee-name" autoComplete="off" aria-invalid={!!errors.name} {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employee-salary">Monthly salary (₱)</Label>
            <Input
              id="employee-salary"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              aria-invalid={!!errors.monthlySalary}
              {...register("monthlySalary", { valueAsNumber: true })}
            />
            <FieldError message={errors.monthlySalary?.message} />
          </div>
          {employee ? null : (
            <div className="space-y-2">
              <Label htmlFor="employee-start">First salary month</Label>
              <Input id="employee-start" type="month" aria-invalid={!!errors.startMonth} {...register("startMonth")} />
              <FieldError message={errors.startMonth?.message} />
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              {employee ? "Save changes" : "Add employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
