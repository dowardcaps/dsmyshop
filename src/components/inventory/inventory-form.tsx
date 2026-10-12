"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useInventoryForm } from "@/hooks/use-inventory-form";
import type { LinkableService } from "@/lib/inventory/queries";
import type { InventoryInput } from "@/lib/validation/inventory";

interface InventoryFormProps {
  defaultValues: InventoryInput;
  itemId?: string;
  returnHref: string;
  /** Price-list items this item may be linked to. */
  services: LinkableService[];
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

export function InventoryForm({ defaultValues, itemId, returnHref, services }: InventoryFormProps) {
  const { form, submit } = useInventoryForm({ defaultValues, itemId, returnHref });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;
  const number = { valueAsNumber: true } as const;

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="inventoryName">Item name</Label>
            <Input id="inventoryName" maxLength={80} aria-invalid={!!errors.name} {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inventoryQuantity">In stock</Label>
            <Input id="inventoryQuantity" type="number" inputMode="numeric" min={0} step={1} aria-invalid={!!errors.quantity} {...register("quantity", number)} />
            <FieldError message={errors.quantity?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inventoryLow">Low at or below</Label>
            <Input id="inventoryLow" type="number" inputMode="numeric" min={0} step={1} aria-invalid={!!errors.lowLevel} {...register("lowLevel", number)} />
            <FieldError message={errors.lowLevel?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inventoryHigh">High at or above</Label>
            <Input id="inventoryHigh" type="number" inputMode="numeric" min={0} step={1} aria-invalid={!!errors.highLevel} {...register("highLevel", number)} />
            <FieldError message={errors.highLevel?.message} />
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-3">Red = low, amber = medium (in between), green = high.</p>
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="inventoryService">Subtract when this is sold</Label>
            <Select id="inventoryService" aria-describedby="inventory-service-help" {...register("serviceItemId")}>
              <option value="">Not linked (change the stock by hand)</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.label}
                </option>
              ))}
            </Select>
            <p id="inventory-service-help" className="text-xs text-muted-foreground">
              Pick the Transactions item. Each time it is sold, the quantity sold is subtracted here. Printing, Xerox and bond paper are never
              subtracted automatically.
            </p>
            <FieldError message={errors.serviceItemId?.message} />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="inventoryNotes">Notes (optional)</Label>
            <Textarea id="inventoryNotes" rows={2} aria-invalid={!!errors.notes} {...register("notes")} />
            <FieldError message={errors.notes?.message} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button asChild variant="outline">
          <Link href={returnHref} scroll={false}>
            Cancel
          </Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {itemId ? "Save changes" : "Save item"}
        </Button>
      </div>
    </form>
  );
}
