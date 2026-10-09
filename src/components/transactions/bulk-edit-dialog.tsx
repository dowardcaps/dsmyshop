"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useBulkEdit } from "@/hooks/use-bulk-edit";
import { formatPeso } from "@/lib/format";
import { PRICE_ACTIONS, type PriceAction } from "@/lib/transactions/bulk";

const PREVIEW_ROWS = 5;

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: { id: string; name: string; price: number }[];
  categories: { id: string; name: string }[];
  /** Called after a successful save (clear the selection, refresh the list). */
  onSaved: () => void;
}

function BulkEditForm({ targets, categories, onOpenChange, onSaved }: Omit<BulkEditDialogProps, "open">) {
  const edit = useBulkEdit({
    targets,
    onDone: () => {
      onOpenChange(false);
      onSaved();
    },
  });
  const unit = edit.priceAction.endsWith("percent") ? "%" : "₱";
  const shown = edit.preview.slice(0, PREVIEW_ROWS);
  const count = targets.length;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void edit.save();
      }}
      className="grid gap-4"
    >
      <DialogHeader>
        <DialogTitle>
          Edit {count} selected {count === 1 ? "service" : "services"}
        </DialogTitle>
        <DialogDescription>Fill in only what you want to change. Everything else stays as it is, and past sales are never affected.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <div className="space-y-2">
          <Label htmlFor="bulkPriceAction">Price</Label>
          <Select id="bulkPriceAction" value={edit.priceAction} onChange={(e) => edit.setPriceAction(e.target.value as PriceAction)}>
            {PRICE_ACTIONS.map((action) => (
              <option key={action.value} value={action.value}>
                {action.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bulkPriceValue">{edit.wantsPrice ? `Amount (${unit})` : "Amount"}</Label>
          <Input
            id="bulkPriceValue"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={edit.priceValue}
            onChange={(e) => edit.setPriceValue(e.target.value)}
            disabled={!edit.wantsPrice}
            className="tabular-nums"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bulkCategory">Move to category</Label>
        <Select id="bulkCategory" value={edit.categoryId} onChange={(e) => edit.setCategoryId(e.target.value)}>
          <option value="">Don&apos;t change</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>

      {edit.wantsPrice ? (
        <div className="rounded-lg border">
          <p className="border-b px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Price preview</p>
          <ul className="divide-y text-sm">
            {shown.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 px-3 py-1.5">
                <span className="min-w-0 truncate">{row.name}</span>
                <span className="shrink-0 tabular-nums">
                  <span className="text-muted-foreground">{formatPeso(row.price)}</span> →{" "}
                  {row.newPrice === null ? <span className="font-medium text-destructive">not allowed</span> : <span className="font-medium">{formatPeso(row.newPrice)}</span>}
                </span>
              </li>
            ))}
          </ul>
          {count > PREVIEW_ROWS ? <p className="border-t px-3 py-1.5 text-xs text-muted-foreground">…and {count - PREVIEW_ROWS} more</p> : null}
        </div>
      ) : null}
      {edit.invalidCount > 0 ? (
        <p role="alert" className="text-sm text-destructive">
          {edit.invalidCount} {edit.invalidCount === 1 ? "service would" : "services would"} end up below ₱0.01. Adjust the amount.
        </p>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={edit.saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={!edit.canSave}>
          {edit.saving ? <Loader2 className="animate-spin" /> : null}
          Apply to {count}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function BulkEditDialog({ open, onOpenChange, ...rest }: BulkEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Mounted only while open, so every opening starts blank. */}
        <BulkEditForm onOpenChange={onOpenChange} {...rest} />
      </DialogContent>
    </Dialog>
  );
}
