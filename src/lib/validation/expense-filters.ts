import { EXPENSES_PAGE_SIZE } from "@/lib/expenses/constants";
import { firstParam, parseDateParam, parsePageParam, type RawSearchParams } from "@/lib/validation/filter-utils";

export interface ExpenseFilters {
  q?: string;
  from?: string;
  to?: string;
  categoryId?: string;
  page: number;
  pageSize: number;
}

/** Parses untrusted URL search params into safe filters. Invalid values are dropped. */
export function parseExpenseFilters(params: RawSearchParams): ExpenseFilters {
  return {
    q: firstParam(params.q)?.slice(0, 100),
    from: parseDateParam(params.from),
    to: parseDateParam(params.to),
    categoryId: firstParam(params.category),
    page: parsePageParam(params.page),
    pageSize: EXPENSES_PAGE_SIZE,
  };
}

export function expenseFiltersToQuery(filters: ExpenseFilters, page?: number): string {
  const search = new URLSearchParams();
  if (filters.q) search.set("q", filters.q);
  if (filters.from) search.set("from", filters.from);
  if (filters.to) search.set("to", filters.to);
  if (filters.categoryId) search.set("category", filters.categoryId);
  const target = page ?? filters.page;
  if (target > 1) search.set("page", String(target));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const hasActiveExpenseFilters = (filters: ExpenseFilters): boolean =>
  Boolean(filters.q || filters.from || filters.to || filters.categoryId);
