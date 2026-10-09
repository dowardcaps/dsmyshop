"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useExcessForm } from "@/hooks/use-excess-form";
import type { ExcessInput } from "@/lib/validation/excess";

interface ExcessFormProps {
  defaultValues: ExcessInput;
  excessId?: string;
  returnHref: string;
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

export function ExcessForm({ defaultValues, excessId, returnHref }: ExcessFormProps) {
  const { form, submit } = useExcessForm({ defaultValues, excessId, returnHref });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="excessDate">Date</Label>
            <Input id="excessDate" type="date" aria-invalid={!!errors.excessDate} {...register("excessDate")} />
            <FieldError message={errors.excessDate?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="excessAmount">Amount (₱)</Label>
            <Input
              id="excessAmount"
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
            <Label htmlFor="excessNotes">Notes (optional)</Label>
            <Textarea id="excessNotes" rows={2} aria-invalid={!!errors.notes} {...register("notes")} />
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
          {excessId ? "Save changes" : "Save record"}
        </Button>
      </div>
    </form>
  );
}
