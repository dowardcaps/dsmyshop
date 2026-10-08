"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toCents } from "@/lib/cents";
import { formatPeso } from "@/lib/format";
import { changeCents } from "@/lib/transactions/cart";
import { cn } from "@/lib/utils";

const QUICK_CASH = [50, 100, 200, 500, 1000];

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalCents: number;
  saving: boolean;
  /** Saves the sale. Resolves true when it worked, which closes the dialog. */
  onConfirm: () => Promise<boolean>;
}

function PaymentForm({ onOpenChange, totalCents, saving, onConfirm }: Omit<PaymentDialogProps, "open">) {
  const [cash, setCash] = useState("");
  const cashCents = cash === "" ? 0 : toCents(Number(cash));
  const enough = cash !== "" && cashCents >= totalCents;
  const short = cash !== "" && cashCents < totalCents;

  async function confirm() {
    if (!enough) return;
    if (await onConfirm()) onOpenChange(false);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void confirm();
      }}
      className="grid gap-4"
    >
      <DialogHeader>
        <DialogTitle>Complete transaction</DialogTitle>
        <DialogDescription>Enter the cash received. The sale is saved to Sales when you press Save.</DialogDescription>
      </DialogHeader>

      <div className="flex items-center justify-between border-b pb-3">
        <span className="text-muted-foreground">Total amount</span>
        <strong className="text-xl tabular-nums">{formatPeso(totalCents / 100)}</strong>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cashReceived">Cash received (₱)</Label>
        <Input
          id="cashReceived"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          autoFocus
          value={cash}
          onChange={(event) => setCash(event.target.value)}
          aria-invalid={short}
          placeholder="0.00"
          className="tabular-nums"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setCash(String(totalCents / 100))}>
            Exact
          </Button>
          {QUICK_CASH.map((amount) => (
            <Button key={amount} type="button" variant="outline" size="sm" onClick={() => setCash(String(amount))}>
              ₱{amount}
            </Button>
          ))}
        </div>
      </div>

      <div className={cn("rounded-lg border p-4 text-center", short ? "border-destructive/50" : "border-emerald-600/40")}>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{short ? "Still short" : "Change"}</p>
        <p className={cn("mt-1 text-3xl font-semibold tabular-nums", short ? "text-destructive" : "text-emerald-600")}>
          {formatPeso((short ? totalCents - cashCents : changeCents(cashCents, totalCents)) / 100)}
        </p>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
          Back
        </Button>
        <Button type="submit" disabled={!enough || saving}>
          {saving ? <Loader2 className="animate-spin" /> : null}
          Save sale &amp; clear
        </Button>
      </DialogFooter>
    </form>
  );
}

export function PaymentDialog({ open, ...rest }: PaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={rest.onOpenChange}>
      <DialogContent>
        {/* Mounted only while open, so the cash field starts empty every time. */}
        <PaymentForm {...rest} />
      </DialogContent>
    </Dialog>
  );
}
