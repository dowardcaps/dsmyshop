"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useServiceForm } from "@/hooks/use-service-form";
import type { ServiceInput } from "@/lib/validation/transaction";

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: { id: string; name: string }[];
  /** Present when editing. */
  service?: { id: string } & ServiceInput;
}

function ServiceForm({ categories, service, onOpenChange }: Omit<ServiceFormDialogProps, "open">) {
  const { form, submit } = useServiceForm({
    serviceId: service?.id,
    onDone: () => onOpenChange(false),
    defaultValues: service
      ? { name: service.name, categoryId: service.categoryId, price: service.price }
      : { name: "", categoryId: categories[0]?.id ?? "", price: Number.NaN },
  });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{service ? "Edit service" : "Add service"}</DialogTitle>
        <DialogDescription>Changing a price only affects new sales. Past sales keep the price they were saved with.</DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="serviceName">Name</Label>
        <Input id="serviceName" autoComplete="off" autoFocus aria-invalid={!!errors.name} {...register("name")} />
        {errors.name ? <p role="alert" className="text-xs text-destructive">{errors.name.message}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="serviceCategory">Category</Label>
          <Select id="serviceCategory" aria-invalid={!!errors.categoryId} {...register("categoryId")}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          {errors.categoryId ? <p role="alert" className="text-xs text-destructive">{errors.categoryId.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="servicePrice">Price (₱)</Label>
          <Input
            id="servicePrice"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            aria-invalid={!!errors.price}
            {...register("price", { valueAsNumber: true })}
          />
          {errors.price ? <p role="alert" className="text-xs text-destructive">{errors.price.message}</p> : null}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          {service ? "Save changes" : "Add service"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ServiceFormDialog({ open, onOpenChange, ...rest }: ServiceFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Mounted only while open, so every opening starts from fresh values. */}
        <ServiceForm onOpenChange={onOpenChange} {...rest} />
      </DialogContent>
    </Dialog>
  );
}
