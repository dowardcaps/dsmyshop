"use client";

import { Pencil, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BulkActionBarProps {
  count: number;
  hiddenCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onClear: () => void;
}

/** Appears at the bottom of the list while at least one row is checked. */
export function BulkActionBar({ count, hiddenCount, onEdit, onDelete, onClear }: BulkActionBarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className="sticky bottom-4 z-10 flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3 shadow-lg"
    >
      <p className="mr-auto text-sm" aria-live="polite">
        <span className="font-semibold">{count} selected</span>
        {hiddenCount > 0 ? <span className="text-muted-foreground"> (+{hiddenCount} hidden by search, not included)</span> : null}
      </p>
      <Button type="button" size="sm" onClick={onEdit} disabled={count === 0}>
        <Pencil /> Edit selected
      </Button>
      <Button type="button" size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={onDelete} disabled={count === 0}>
        <Trash2 /> Delete
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onClear}>
        <X /> Clear
      </Button>
    </div>
  );
}
