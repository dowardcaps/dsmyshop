"use client";

import { useCallback, useMemo, useRef, useState } from "react";

/**
 * Bulk-edit mode and the checked rows of a paged, searchable list.
 *
 * - `matchingIds`: every row matching the current search, across all pages. Bulk actions apply to
 *   the checked rows among these, so a search never changes rows you cannot see.
 * - `pageIds`: the rows on the page being shown. The header checkbox and shift-click work on these.
 */
export function useServiceSelection(matchingIds: readonly string[], pageIds: readonly string[]) {
  const [bulkMode, setBulkMode] = useState(false);
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const anchor = useRef<string | null>(null);

  const selectedIds = useMemo(() => matchingIds.filter((id) => checked.has(id)), [matchingIds, checked]);
  const hiddenCount = checked.size - selectedIds.length;
  const pageSelectedCount = useMemo(() => pageIds.filter((id) => checked.has(id)).length, [pageIds, checked]);
  const allOnPageSelected = pageIds.length > 0 && pageSelectedCount === pageIds.length;
  const allMatchingSelected = matchingIds.length > 0 && selectedIds.length === matchingIds.length;

  const toggle = useCallback(
    (id: string, shiftKey = false) => {
      // Read the anchor now: the state updater below runs later, after the anchor has moved on.
      const from = anchor.current ? pageIds.indexOf(anchor.current) : -1;
      const to = pageIds.indexOf(id);
      const range = shiftKey && from !== -1 && to !== -1 ? pageIds.slice(Math.min(from, to), Math.max(from, to) + 1) : [id];
      setChecked((previous) => {
        const next = new Set(previous);
        const turnOn = !previous.has(id);
        for (const rangeId of range) {
          if (turnOn) next.add(rangeId);
          else next.delete(rangeId);
        }
        return next;
      });
      anchor.current = id;
    },
    [pageIds],
  );

  /** Header checkbox: check every row on this page, or uncheck them if they are all checked. */
  const togglePage = useCallback(() => {
    setChecked((previous) => {
      const next = new Set(previous);
      const everyChecked = pageIds.length > 0 && pageIds.every((id) => previous.has(id));
      for (const id of pageIds) {
        if (everyChecked) next.delete(id);
        else next.add(id);
      }
      return next;
    });
    anchor.current = null;
  }, [pageIds]);

  /** "Select all 97": check every row matching the search, on every page. */
  const selectAllMatching = useCallback(() => {
    setChecked((previous) => new Set([...previous, ...matchingIds]));
  }, [matchingIds]);

  const clear = useCallback(() => {
    setChecked(new Set());
    anchor.current = null;
  }, []);

  const setMode = useCallback(
    (enabled: boolean) => {
      setBulkMode(enabled);
      if (!enabled) clear();
    },
    [clear],
  );

  return {
    bulkMode,
    setBulkMode: setMode,
    totalChecked: checked.size,
    isChecked: (id: string) => checked.has(id),
    selectedIds,
    hiddenCount,
    pageSelectedCount,
    allOnPageSelected,
    allMatchingSelected,
    toggle,
    togglePage,
    selectAllMatching,
    clear,
  };
}

export type ServiceSelection = ReturnType<typeof useServiceSelection>;
