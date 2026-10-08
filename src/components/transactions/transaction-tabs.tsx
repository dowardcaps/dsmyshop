"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CartTab } from "@/lib/transactions/cart";
import { cn } from "@/lib/utils";

interface TransactionTabsProps {
  tabs: CartTab[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

/** One tab per customer being served at the same time. */
export function TransactionTabs({ tabs, activeId, onSelect, onAdd, onRemove }: TransactionTabsProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2">
      <div role="tablist" aria-label="Open transactions" className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          const count = Object.values(tab.cart).reduce((sum, qty) => sum + qty, 0);
          return (
            <div
              key={tab.id}
              className={cn(
                "flex shrink-0 items-center rounded-md border text-sm font-medium",
                active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-accent",
              )}
            >
              <button
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelect(tab.id)}
                className="rounded-md px-3 py-1.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {tab.name}
                {count > 0 ? <span className="ml-1.5 text-xs opacity-80">({count})</span> : null}
              </button>
              {tabs.length > 1 ? (
                <button
                  type="button"
                  onClick={() => onRemove(tab.id)}
                  aria-label={`Close ${tab.name}`}
                  className="mr-1 rounded p-1 opacity-70 outline-none hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      <Button type="button" size="sm" onClick={onAdd}>
        <Plus /> <span className="hidden sm:inline">New transaction</span>
        <span className="sm:hidden">New</span>
      </Button>
    </div>
  );
}
