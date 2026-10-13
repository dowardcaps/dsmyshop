"use client";

import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useWatch } from "react-hook-form";

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
    control,
    formState: { errors, isSubmitting },
  } = form;
  const number = { valueAsNumber: true } as const;
  const { fields, append, remove } = useFieldArray({ control, name: "links" });
  const chosen = useWatch({ control, name: "links" }) ?? [];
  const chosenIds = new Set(chosen.map((link) => link?.serviceItemId).filter(Boolean));
  const nextFree = services.find((service) => !chosenIds.has(service.id));

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
          <fieldset className="space-y-3 sm:col-span-3">
            <legend className="text-sm font-medium">Subtract when these are sold</legend>
            <p className="text-xs text-muted-foreground">
              Add every Transactions item that uses this stock, and how many it uses each time it is sold (for example 3R photo paper:
              Rush ID P1 and P6, 1 each). Printing, Xerox and bond paper are never subtracted automatically.
            </p>
            {fields.length === 0 ? <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Not linked: change the stock by hand.</p> : null}
            {fields.map((field, index) => {
              const own = chosen[index]?.serviceItemId;
              return (
                <div key={field.id} className="grid grid-cols-[1fr_5.5rem_auto] items-start gap-2" data-testid="inventory-link-row">
                  <div className="space-y-1">
                    <Select aria-label={`Price-list item ${index + 1}`} aria-invalid={!!errors.links?.[index]?.serviceItemId} {...register(`links.${index}.serviceItemId`)}>
                      <option value="">Choose an item…</option>
                      {services
                        .filter((service) => service.id === own || !chosenIds.has(service.id))
                        .map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.label}
                          </option>
                        ))}
                    </Select>
                    <FieldError message={errors.links?.[index]?.serviceItemId?.message} />
                  </div>
                  <div className="space-y-1">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      aria-label={`Used per sale ${index + 1}`}
                      title="Used per sale"
                      aria-invalid={!!errors.links?.[index]?.unitsPerSale}
                      {...register(`links.${index}.unitsPerSale`, number)}
                    />
                    <FieldError message={errors.links?.[index]?.unitsPerSale?.message} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Remove price-list item ${index + 1}`} onClick={() => remove(index)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              );
            })}
            <FieldError message={errors.links?.message ?? (errors.links as { root?: { message?: string } } | undefined)?.root?.message} />
            <Button type="button" variant="outline" size="sm" disabled={!nextFree} onClick={() => append({ serviceItemId: "", unitsPerSale: 1 })}>
              <Plus /> Add price-list item
            </Button>
          </fieldset>
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
