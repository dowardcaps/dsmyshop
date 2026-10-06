import {
  GCASH_PAGE_SIZE,
  GCASH_PROVIDERS,
  GCASH_TRANSACTION_TYPES,
  type GcashProviderValue,
  type GcashTransactionTypeValue,
} from "@/lib/gcash/constants";
import {
  firstParam,
  parseDateParam,
  parseEnumParam,
  parsePageParam,
  type RawSearchParams,
} from "@/lib/validation/filter-utils";

export interface GcashFilters {
  q?: string;
  from?: string;
  to?: string;
  type?: GcashTransactionTypeValue;
  provider?: GcashProviderValue;
  page: number;
  pageSize: number;
}

/** Parses untrusted URL search params into safe filters. Invalid values are dropped. */
export function parseGcashFilters(params: RawSearchParams): GcashFilters {
  return {
    q: firstParam(params.q)?.slice(0, 100),
    from: parseDateParam(params.from),
    to: parseDateParam(params.to),
    type: parseEnumParam(params.type, GCASH_TRANSACTION_TYPES),
    provider: parseEnumParam(params.provider, GCASH_PROVIDERS),
    page: parsePageParam(params.page),
    pageSize: GCASH_PAGE_SIZE,
  };
}

export function gcashFiltersToQuery(filters: GcashFilters, page?: number): string {
  const search = new URLSearchParams();
  if (filters.q) search.set("q", filters.q);
  if (filters.from) search.set("from", filters.from);
  if (filters.to) search.set("to", filters.to);
  if (filters.type) search.set("type", filters.type);
  if (filters.provider) search.set("provider", filters.provider);
  const target = page ?? filters.page;
  if (target > 1) search.set("page", String(target));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const hasActiveGcashFilters = (filters: GcashFilters): boolean =>
  Boolean(filters.q || filters.from || filters.to || filters.type || filters.provider);
