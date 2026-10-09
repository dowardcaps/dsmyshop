"use client";

import Link from "next/link";

import { useRecordFilters } from "@/hooks/use-record-filters";
import { recordsHrefFor } from "@/lib/records/filter-state";
import { RECORD_TABS, RECORD_TAB_LABELS, type RecordTab } from "@/lib/records/tabs";
import { cn } from "@/lib/utils";

/** Tab links. Each one opens that table with the filters the browser remembers. */
export function RecordsTabs({ active }: { active: RecordTab }) {
  const { stored } = useRecordFilters();

  return (
    <nav aria-label="Record types" className="overflow-x-auto rounded-xl border bg-card px-3">
      <ul className="flex gap-1">
        {RECORD_TABS.map((tab) => {
          const isActive = tab === active;
          return (
            <li key={tab}>
              <Link
                href={recordsHrefFor(stored, tab)}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative inline-flex h-11 cursor-pointer items-center px-3 text-sm font-medium transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {RECORD_TAB_LABELS[tab]}
                {isActive ? <span aria-hidden className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
