"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  applyFilters,
  clearFilters,
  stateFromUrl,
  type FilterValues,
  type RecordFilterState,
} from "@/lib/records/filter-state";
import { getServerSnapshot, getSnapshot, subscribe, updateFilterState } from "@/lib/records/filter-store";
import type { RecordTab } from "@/lib/records/tabs";

export interface UseRecordFilters {
  stored: RecordFilterState;
  apply: (tab: RecordTab, values: FilterValues) => void;
  clear: (tab: RecordTab) => void;
  /** Remember what the URL shows (URL filters win over remembered ones). */
  rememberUrl: (tab: RecordTab, params: URLSearchParams) => void;
}

export function useRecordFilters(): UseRecordFilters {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const apply = useCallback((tab: RecordTab, values: FilterValues) => updateFilterState((s) => applyFilters(s, tab, values)), []);
  const clear = useCallback((tab: RecordTab) => updateFilterState((s) => clearFilters(s, tab)), []);
  const rememberUrl = useCallback(
    (tab: RecordTab, params: URLSearchParams) => updateFilterState((s) => ({ ...stateFromUrl(s, params, tab), tab })),
    [],
  );

  return { stored, apply, clear, rememberUrl };
}
