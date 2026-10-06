"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import type { ActionResult } from "@/lib/actions/types";

interface ConfirmDeleteButtonProps {
  /** Server action already bound to the record id, e.g. deleteSaleAction.bind(null, id). */
  action: () => Promise<ActionResult>;
  title: string;
  description: string;
  successMessage: string;
  /** Accessible name when only the icon is shown. */
  ariaLabel?: string;
  confirmLabel?: string;
  /** Where to go after deleting. Stays on the page (and refreshes) when omitted. */
  redirectTo?: string;
  iconOnly?: boolean;
  /** Disables the button, e.g. when the record is in use. `disabledReason` becomes its tooltip. */
  disabled?: boolean;
  disabledReason?: string;
}

export function ConfirmDeleteButton({
  action,
  title,
  description,
  successMessage,
  ariaLabel,
  confirmLabel = "Delete",
  redirectTo,
  iconOnly = false,
  disabled = false,
  disabledReason,
}: ConfirmDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={iconOnly ? "ghost" : "outline"}
          size={iconOnly ? "icon" : "default"}
          className="text-destructive hover:text-destructive"
          aria-label={iconOnly ? ariaLabel : undefined}
          disabled={disabled}
          title={disabled ? disabledReason : undefined}
        >
          <Trash2 className="size-4" />
          {iconOnly ? null : "Delete"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={pending}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={confirmDelete} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
