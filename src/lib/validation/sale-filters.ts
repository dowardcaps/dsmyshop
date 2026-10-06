import { PAYMENT_METHODS, SALES_PAGE_SIZE, type PaymentMethodValue } from "@/lib/sales/constants";
import {
  firstParam,
  parseDateParam,
  parseEnumParam,
  parsePageParam,
  type RawSearchParams,
} from "@/lib/validation/filter-utils";

export interface SaleFilters {
  q?: string;
  from?: string;
  to?: string;
  categoryId?: string;
  paymentMethod?: PaymentMethodValue;
  page: number;
  pageSize: number;
}

/** Parses untrusted URL search params into safe filters. Invalid values are dropped. */
export function parseSaleFilters(params: RawSearchParams): SaleFilters {
  return {
    q: firstParam(params.q)?.slice(0, 100),
    from: parseDateParam(params.from),
    to: parseDateParam(params.to),
    categoryId: firstParam(params.category),
    paymentMethod: parseEnumParam(params.payment, PAYMENT_METHODS),
    page: parsePageParam(params.page),
    pageSize: SALES_PAGE_SIZE,
  };
}

/** Builds a /sales query string from filters, optionally overriding the page. */
export function saleFiltersToQuery(filters: SaleFilters, page?: number): string {
  const search = new URLSearchParams();
  if (filters.q) search.set("q", filters.q);
  if (filters.from) search.set("from", filters.from);
  if (filters.to) search.set("to", filters.to);
  if (filters.categoryId) search.set("category", filters.categoryId);
  if (filters.paymentMethod) search.set("payment", filters.paymentMethod);
  const target = page ?? filters.page;
  if (target > 1) search.set("page", String(target));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const hasActiveFilters = (filters: SaleFilters): boolean =>
  Boolean(filters.q || filters.from || filters.to || filters.categoryId || filters.paymentMethod);
