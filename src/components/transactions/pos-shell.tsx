"use client";

import { useState } from "react";

import { PaymentDialog } from "@/components/transactions/payment-dialog";
import { PosContext } from "@/components/transactions/pos-context";
import { SummaryPanel } from "@/components/transactions/summary-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCheckout } from "@/hooks/use-checkout";
import { useTransactionCart } from "@/hooks/use-transaction-cart";
import type { PosService } from "@/lib/transactions/cart";

/**
 * Full-screen frame for the POS and Manage services pages.
 * The page sits on the left and scrolls by itself; the Summary of the open order is pinned on the
 * right and stays the same on both pages, so the order is never lost while prices are being managed.
 * On phones the Summary sits under the page.
 */
export function PosShell({
  services,
  children,
}: {
  services: PosService[];
  children: React.ReactNode;
}) {
  const cart = useTransactionCart(services);
  const checkout = useCheckout({
    items: cart.summary.items,
    onSaved: cart.clearCart,
  });
  const [payOpen, setPayOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <PosContext.Provider
      value={{ cart, checkout, askReset: () => setResetOpen(true) }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden"
        data-testid="pos-shell"
      >
        <div className="min-w-0 flex-1 p-4 sm:p-6 lg:min-h-0 lg:overflow-y-auto">
          {children}
        </div>
        <aside
          aria-label="Order summary"
          data-testid="pos-summary"
          className="shrink-0 border-t bg-card lg:min-h-0 lg:w-[24rem] lg:border-l lg:border-t-0 xl:w-[28rem] 2xl:w-[32rem]"
        >
          <SummaryPanel
            summary={cart.summary}
            checkout={checkout}
            tabName={cart.active.name}
            onPay={() => setPayOpen(true)}
          />
        </aside>
      </div>

      <PaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        totalCents={cart.summary.totalCents}
        saving={checkout.saving}
        onConfirm={checkout.save}
      />

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear this order?</DialogTitle>
            <DialogDescription>
              All quantities in {cart.active.name} go back to zero. Nothing is
              saved to Sales.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                cart.clearCart();
                setResetOpen(false);
              }}
            >
              Clear order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PosContext.Provider>
  );
}
