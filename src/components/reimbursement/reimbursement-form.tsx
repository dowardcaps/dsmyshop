"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useReimbursementForm } from "@/hooks/use-reimbursement-form";
import type { ReimbursementInput } from "@/lib/validation/reimbursement";

interface ReimbursementFormProps {
  defaultValues: ReimbursementInput;
  reimbursementId?: string;
  returnHref: string;
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

export function ReimbursementForm({ defaultValues, reimbursementId, returnHref }: ReimbursementFormProps) {
  const { form, submit } = useReimbursementForm({ defaultValues, reimbursementId, returnHref });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="reimbursementDescription">Paid to / for what</Label>
            <Input id="reimbursementDescription" placeholder="e.g. Sophia - paper delivery fare" aria-invalid={!!errors.description} {...register("description")} />
            <FieldError message={errors.description?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reimbursementDate">Date</Label>
            <Input id="reimbursementDate" type="date" aria-invalid={!!errors.reimbursementDate} {...register("reimbursementDate")} />
            <FieldError message={errors.reimbursementDate?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reimbursementAmount">Amount (₱)</Label>
            <Input
              id="reimbursementAmount"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              aria-invalid={!!errors.amount}
              {...register("amount", { valueAsNumber: true })}
            />
            <FieldError message={errors.amount?.message} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="reimbursementNotes">Notes (optional)</Label>
            <Textarea id="reimbursementNotes" rows={2} aria-invalid={!!errors.notes} {...register("notes")} />
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
          {reimbursementId ? "Save changes" : "Save record"}
        </Button>
      </div>
    </form>
  );
}
