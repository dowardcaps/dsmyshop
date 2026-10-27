"use client";

import Link from "next/link";
import {
  Banknote,
  CircleMinus,
  CirclePlus,
  HandCoins,
  Receipt,
  ShoppingCart,
  Smartphone,
  Undo2,
  type LucideIcon,
} from "lucide-react";

import { useRecordFilters } from "@/hooks/use-record-filters";
import { recordsHrefFor } from "@/lib/records/filter-state";
import {
  RECORD_TABS,
  RECORD_TAB_LABELS,
  type RecordTab,
} from "@/lib/records/tabs";
import { cn } from "@/lib/utils";

const TAB_ICONS: Record<RecordTab, LucideIcon> = {
  sales: ShoppingCart,
  gcash: Smartphone,
  expenses: Receipt,
  debts: HandCoins,
  excess: CirclePlus,
  short: CircleMinus,
  reimbursement: Undo2,
  salary: Banknote,
};

/**
 * The record types as a side menu (a scrolling row on phones). Each one opens that table with the
 * filters the browser remembers.
 */
export function RecordsTabs({ active }: { active: RecordTab }) {
  const { stored } = useRecordFilters();

  return (
    <nav
      aria-label="Record types"
      className="shrink-0 overflow-x-auto border-b bg-card px-3 py-2 lg:w-56 lg:overflow-y-auto lg:overflow-x-visible lg:border-b-0 lg:border-r lg:px-3 lg:py-4"
    >
      <p className="mb-2 hidden px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:block">
        Records
      </p>
      <ul className="flex gap-1 lg:flex-col">
        {RECORD_TABS.map((tab) => {
          const isActive = tab === active;
          const Icon = TAB_ICONS[tab];
          return (
            <li key={tab} className="shrink-0">
              <Link
                href={recordsHrefFor(stored, tab)}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {RECORD_TAB_LABELS[tab]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
