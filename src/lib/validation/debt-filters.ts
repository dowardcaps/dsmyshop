import { DEBT_STATUSES, DEBTS_PAGE_SIZE, type DebtStatusValue } from "@/lib/debts/constants";
import { firstParam, parseDateParam, parseEnumParam, parsePageParam, type RawSearchParams } from "@/lib/validation/filter-utils";

export interface DebtFilters {
  q?: string;
  /** Debt date range (inclusive), YYYY-MM-DD. */
  from?: string;
  to?: string;
  status?: DebtStatusValue;
  page: number;
  pageSize: number;
}

/** Parses untrusted URL search params into safe filters. Invalid values are dropped. */
export function parseDebtFilters(params: RawSearchParams): DebtFilters {
  return {
    q: firstParam(params.q)?.slice(0, 100),
    from: parseDateParam(params.from),
    to: parseDateParam(params.to),
    status: parseEnumParam(params.status, DEBT_STATUSES),
    page: parsePageParam(params.page),
    pageSize: DEBTS_PAGE_SIZE,
  };
}

export function debtFiltersToQuery(filters: DebtFilters, page?: number): string {
  const search = new URLSearchParams();
  if (filters.q) search.set("q", filters.q);
  if (filters.from) search.set("from", filters.from);
  if (filters.to) search.set("to", filters.to);
  if (filters.status) search.set("status", filters.status);
  const target = page ?? filters.page;
  if (target > 1) search.set("page", String(target));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const hasActiveDebtFilters = (filters: DebtFilters): boolean => Boolean(filters.q || filters.from || filters.to || filters.status);
