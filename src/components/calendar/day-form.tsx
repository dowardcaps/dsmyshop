"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShopDayForm } from "@/hooks/use-shop-day-form";
import {
  SHOP_DAY_LABELS,
  SHOP_DAY_STATUSES,
  SHOP_DAY_STYLES,
} from "@/lib/calendar/constants";
import type { ShopDayInput } from "@/lib/validation/calendar";
import { cn } from "@/lib/utils";

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

export function DayForm({
  defaultValues,
  hasStatus,
  returnHref,
}: {
  defaultValues: ShopDayInput;
  hasStatus: boolean;
  returnHref: string;
}) {
  const { form, submit, clear } = useShopDayForm({ defaultValues, returnHref });
  const {
    register,
    watch,
    formState: { errors, isSubmitting },
  } = form;
  const selected = watch("status");

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Was the shop…</legend>
        <div className="grid grid-cols-3 gap-2">
          {SHOP_DAY_STATUSES.map((status) => (
            <label
              key={status}
              className={cn(
                "flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-3 py-3 text-sm font-medium transition-opacity has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                SHOP_DAY_STYLES[status].chip,
                selected === status
                  ? "ring-2 ring-foreground/70"
                  : "opacity-60 hover:opacity-100",
              )}
            >
              <input
                type="radio"
                value={status}
                className="sr-only"
                {...register("status")}
              />
              <span
                className={cn(
                  "size-2.5 rounded-full",
                  SHOP_DAY_STYLES[status].dot,
                )}
                aria-hidden
              />
              {SHOP_DAY_LABELS[status]}
            </label>
          ))}
        </div>
        <FieldError message={errors.status?.message} />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="shopFrom">From</Label>
          <Input
            id="shopFrom"
            type="date"
            aria-invalid={!!errors.fromDate}
            {...register("fromDate")}
          />
          <FieldError message={errors.fromDate?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shopTo">To</Label>
          <Input
            id="shopTo"
            type="date"
            aria-invalid={!!errors.toDate}
            {...register("toDate")}
          />
          <FieldError message={errors.toDate?.message} />
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          To mark several days at once (like a holiday week), change the To
          date.
        </p>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="shopNote">Note (optional)</Label>
          <Input
            id="shopNote"
            placeholder="e.g. Holiday, power outage, half day for errands"
            aria-invalid={!!errors.note}
            {...register("note")}
          />
          <FieldError message={errors.note?.message} />
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-2">
        <div>
          {hasStatus ? (
            <Button
              type="button"
              variant="outline"
              onClick={clear}
              disabled={isSubmitting}
            >
              Reset to default
            </Button>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost">
            <Link href={returnHref}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            Save
          </Button>
        </div>
      </div>
    </form>
  );
}
