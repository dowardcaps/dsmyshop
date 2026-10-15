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
import { useGcashBalanceForm } from "@/hooks/use-gcash-balance-form";

interface GcashBalanceDialogProps {
  /** Current balance in pesos, to pre-fill the box. */
  currentBalance?: number;
  children: React.ReactNode;
}

export function GcashBalanceDialog({
  currentBalance,
  children,
}: GcashBalanceDialogProps) {
  const [open, setOpen] = useState(false);
  const { form, submit } = useGcashBalanceForm({
    currentBalance,
    onSaved: () => setOpen(false),
  });
  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    // Always start from the balance as it is now, not as it was when the page first loaded.
    reset({ balance: currentBalance as number });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Set GCash balance</DialogTitle>
            <DialogDescription>
              Type the balance your GCash app shows right now. From then on,
              every transaction you record updates it: Cash Out adds, Cash In
              and Load subtract.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="gcashBalance">Balance in the GCash app (₱)</Label>
            <Input
              id="gcashBalance"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              aria-invalid={!!errors.balance}
              {...register("balance", { valueAsNumber: true })}
            />
            {errors.balance ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.balance.message}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              Save balance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
