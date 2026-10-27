"use client";

import { useState } from "react";
import { Check, ClipboardCopy, Loader2, Save, Wallet } from "lucide-react";
import { toast } from "sonner";

import { categoryColor } from "@/components/transactions/category-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Checkout } from "@/hooks/use-checkout";
import { copyToClipboard } from "@/lib/clipboard";
import { formatPeso } from "@/lib/format";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
} from "@/lib/sales/constants";
import { cn } from "@/lib/utils";
import {
  buildSummaryText,
  toExcelRow,
  type CartSummary,
} from "@/lib/transactions/cart";

interface SummaryPanelProps {
  summary: CartSummary;
  checkout: Checkout;
  /** Name of the open transaction tab, shown in the header. */
  tabName: string;
  onPay: () => void;
}

export function SummaryPanel({
  summary,
  checkout,
  tabName,
  onPay,
}: SummaryPanelProps) {
  const [copied, setCopied] = useState(false);
  const empty = summary.items.length === 0;
  const unpaid = checkout.paymentStatus === "UNPAID";

  async function copySummary() {
    if (empty) return;
    const ok = await copyToClipboard(
      toExcelRow(buildSummaryText(summary.groups), summary.totalCents),
    );
    if (!ok) {
      toast.error("Copy was blocked by the browser.");
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b px-5 py-3">
        <h2 className="min-w-0 truncate text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Summary{" "}
          <span className="font-normal normal-case tracking-normal">
            · {tabName}
          </span>
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copySummary}
          disabled={empty}
          title="Copy as an Excel row"
        >
          {copied ? <Check /> : <ClipboardCopy />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      {/* Only this list scrolls: on a long order the fields, total and Pay stay in view. */}
      <div
        className="min-h-24 max-h-[45dvh] flex-1 overflow-y-auto overscroll-contain px-5 py-4 lg:max-h-none"
        tabIndex={0}
        role="region"
        aria-label="Order items"
        aria-live="polite"
      >
        {empty ? (
          <p className="text-sm italic text-muted-foreground">
            No items added yet…
          </p>
        ) : null}
        {summary.groups.map((group) => (
          <div key={group.category} className="mb-3 last:mb-0">
            <p
              className="mb-1 text-sm font-semibold"
              style={{ color: categoryColor(group.category) }}
            >
              {group.category}
            </p>
            <ul className="space-y-0.5 text-sm leading-snug text-muted-foreground">
              {group.lines.map((line) => (
                <li key={line.serviceId}>{line.text}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="grid shrink-0 gap-x-3 gap-y-2 border-t px-5 py-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-[auto_minmax(0,1fr)]">
        <div className="space-y-1">
          <Label htmlFor="saleDate">Date</Label>
          <Input
            id="saleDate"
            type="date"
            value={checkout.transactionDate}
            onChange={(e) => checkout.setTransactionDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="salePayment">Payment</Label>
          <Select
            id="salePayment"
            value={checkout.paymentMethod}
            onChange={(e) =>
              checkout.setPaymentMethod(
                e.target.value as typeof checkout.paymentMethod,
              )
            }
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {PAYMENT_METHOD_LABELS[method]}
              </option>
            ))}
          </Select>
          {checkout.paymentMethod === "GCASH" && !unpaid ? (
            <p
              className="text-xs text-muted-foreground"
              data-testid="gcash-pay-hint"
            >
              The total is added to your GCash balance.
            </p>
          ) : null}
        </div>
        <div className="space-y-1 sm:col-span-2 lg:col-span-1 xl:col-span-2">
          <Label id="saleStatusLabel">Status</Label>
          <div
            role="group"
            aria-labelledby="saleStatusLabel"
            className="grid grid-cols-2 gap-1 rounded-lg border bg-muted/40 p-1"
          >
            {PAYMENT_STATUSES.map((status) => {
              const active = checkout.paymentStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={active}
                  data-testid={`status-${status.toLowerCase()}`}
                  onClick={() => checkout.setPaymentStatus(status)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? status === "PAID"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-amber-500 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-background",
                  )}
                >
                  {PAYMENT_STATUS_LABELS[status]}
                </button>
              );
            })}
          </div>
          {unpaid ? (
            <p
              className="text-xs text-amber-700 dark:text-amber-400"
              data-testid="unpaid-hint"
            >
              Unpaid: saved, but not added to your sales until you mark it as
              paid.
            </p>
          ) : null}
        </div>
        <div className="space-y-1 sm:col-span-2 lg:col-span-1 xl:col-span-2">
          <Label htmlFor="saleCustomer">Customer (optional)</Label>
          <Input
            id="saleCustomer"
            autoComplete="off"
            maxLength={120}
            value={checkout.customerName}
            onChange={(e) => checkout.setCustomerName(e.target.value)}
          />
        </div>
      </div>

      <div className="grid shrink-0 gap-3 border-t border-dashed px-5 py-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {summary.itemCount} item{summary.itemCount === 1 ? "" : "s"}
            </p>
            <p className="text-3xl font-semibold tabular-nums">
              {formatPeso(summary.totalCents / 100)}
            </p>
          </div>
          {unpaid ? null : (
            <Button
              type="button"
              onClick={onPay}
              disabled={empty || checkout.saving}
            >
              <Wallet /> Pay
            </Button>
          )}
        </div>
        <Button
          type="button"
          variant={unpaid ? "default" : "outline"}
          onClick={() => void checkout.save()}
          disabled={empty || checkout.saving}
        >
          {checkout.saving ? <Loader2 className="animate-spin" /> : <Save />}
          {unpaid ? "Save as unpaid" : "Save to Sales"}
        </Button>
      </div>
    </div>
  );
}
