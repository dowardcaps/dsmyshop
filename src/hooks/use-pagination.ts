"use client";

import { useCallback, useMemo, useState } from "react";

import { paginate, TABLE_PAGE_SIZE } from "@/lib/pagination";

interface UsePaginationOptions {
  pageSize?: number;
  /** When this changes (for example the search text), the list goes back to page 1. */
  resetKey?: string;
}

/** Pages an in-memory list. Pair it with <ClientPagination>. */
export function usePagination<T>(rows: readonly T[], { pageSize = TABLE_PAGE_SIZE, resetKey = "" }: UsePaginationOptions = {}) {
  const [state, setState] = useState({ page: 1, key: resetKey });
  // A new resetKey means "start over" without needing an effect to reset the state.
  const requested = state.key === resetKey ? state.page : 1;
  const current = useMemo(() => paginate(rows, requested, pageSize), [rows, requested, pageSize]);
  const setPage = useCallback((page: number) => setState({ page, key: resetKey }), [resetKey]);

  return { ...current, total: rows.length, pageSize, setPage };
}

export type PaginationState<T> = ReturnType<typeof usePagination<T>>;
