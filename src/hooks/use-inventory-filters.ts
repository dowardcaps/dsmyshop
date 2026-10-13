"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { StockLevel } from "@/lib/inventory/stock";
import type { InventoryFilters } from "@/lib/validation/inventory-filters";

const SEARCH_DELAY_MS = 300;

/** Builds /inventory with the given filters (page and dialogs are dropped, so results start on page 1). */
export function inventoryFilterHref(q: string, level: string): string {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (level) params.set("level", level);
  const search = params.toString();
  return search ? `/inventory?${search}` : "/inventory";
}

/**
 * Filters apply by themselves: the search text after a short typing pause, the stock level at once.
 * The URL stays the source of truth, so refresh and bookmarks keep working.
 */
export function useInventoryFilters(filters: InventoryFilters) {
  const router = useRouter();
  const [q, setQ] = useState(filters.q ?? "");
  const [level, setLevel] = useState<StockLevel | "">(filters.level ?? "");
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const applied = useRef(inventoryFilterHref(filters.q ?? "", filters.level ?? ""));

  function go(nextQ: string, nextLevel: string) {
    const href = inventoryFilterHref(nextQ, nextLevel);
    if (href === applied.current) return;
    applied.current = href;
    startTransition(() => router.replace(href, { scroll: false }));
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function changeSearch(value: string) {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => go(value, level), SEARCH_DELAY_MS);
  }

  function changeLevel(value: StockLevel | "") {
    setLevel(value);
    if (timer.current) clearTimeout(timer.current);
    go(q, value);
  }

  function clear() {
    if (timer.current) clearTimeout(timer.current);
    setQ("");
    setLevel("");
    go("", "");
  }

  return { q, level, pending, changeSearch, changeLevel, clear };
}
