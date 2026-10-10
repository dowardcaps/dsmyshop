import { TABLE_PAGE_SIZE } from "@/lib/pagination";
import { firstParam, parseDateParam, parsePageParam, type RawSearchParams } from "@/lib/validation/filter-utils";

export interface ReimbursementFilters {
  q?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

/** Parses untrusted URL search params into safe filters. Invalid values are dropped. */
export function parseReimbursementFilters(params: RawSearchParams): ReimbursementFilters {
  return {
    q: firstParam(params.q)?.slice(0, 100),
    from: parseDateParam(params.from),
    to: parseDateParam(params.to),
    page: parsePageParam(params.page),
    pageSize: TABLE_PAGE_SIZE,
  };
}

export const hasActiveReimbursementFilters = (filters: ReimbursementFilters): boolean => Boolean(filters.q || filters.from || filters.to);
