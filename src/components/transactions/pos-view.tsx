"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { PaymentDialog } from "@/components/transactions/payment-dialog";
import { ServiceTable } from "@/components/transactions/service-table";
import { SummaryPanel } from "@/components/transactions/summary-panel";
import { TransactionTabs } from "@/components/transactions/transaction-tabs";
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
import { Input } from "@/components/ui/input";
import { useCheckout } from "@/hooks/use-checkout";
import { useTransactionCart } from "@/hooks/use-transaction-cart";
import type { PosService } from "@/lib/transactions/cart";

export function PosView({ services }: { services: PosService[] }) {
  const cart = useTransactionCart(services);
  const checkout = useCheckout({ items: cart.summary.items, onSaved: cart.clearCart });
  const [payOpen, setPayOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <div className="space-y-4">
      <TransactionTabs tabs={cart.tabs} activeId={cart.active.id} onSelect={cart.selectTab} onAdd={cart.addTab} onRemove={cart.removeTab} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={cart.active.searchTerm}
            onChange={(event) => cart.setSearchTerm(event.target.value)}
            placeholder="Search a service or category (e.g. Xerox)…"
            aria-label="Search services"
            className="pl-9"
          />
        </div>
        <Button type="button" variant="outline" onClick={() => cart.setSearchTerm("")} disabled={!cart.active.searchTerm}>
          Clear search
        </Button>
        <Button type="button" variant="destructive" onClick={() => setResetOpen(true)} disabled={cart.summary.items.length === 0}>
          Reset order
        </Button>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ServiceTable
          services={cart.visibleServices}
          quantityOf={cart.quantityOf}
          onChange={cart.changeQuantity}
          onSet={cart.setQuantity}
          page={cart.page}
          pageCount={cart.pageCount}
          onPage={cart.setPage}
        />
        <SummaryPanel summary={cart.summary} checkout={checkout} onPay={() => setPayOpen(true)} />
      </div>

      <PaymentDialog open={payOpen} onOpenChange={setPayOpen} totalCents={cart.summary.totalCents} saving={checkout.saving} onConfirm={checkout.save} />

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear this order?</DialogTitle>
            <DialogDescription>All quantities in {cart.active.name} go back to zero. Nothing is saved to Sales.</DialogDescription>
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
    </div>
  );
}
