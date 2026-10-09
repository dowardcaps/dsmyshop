/**
 * Pure logic for the Records page filters. Safe for the browser and the server.
 *
 * Filters have two parts:
 *  - shared: search text and a date range. They apply to every table.
 *  - per tab: the dropdowns that only make sense for one table (category, payment, type...).
 *
 * The URL is what the server reads; this state is what the browser remembers (localStorage)
 * so the same filters are still there after a refresh or the next visit.
 */

import { isValidDateInput } from "@/lib/dates";
import { DEFAULT_RECORD_TAB, RECORD_TABS, parseRecordTab, type RecordTab } from "@/lib/records/tabs";

export const SHARED_FILTER_KEYS = ["q", "from", "to"] as const;
export type SharedFilterKey = (typeof SHARED_FILTER_KEYS)[number];

/** The extra URL params each table understands. */
export const TAB_FILTER_KEYS: Record<RecordTab, readonly string[]> = {
  sales: ["category", "payment"],
  gcash: ["type", "provider"],
  expenses: ["category"],
  debts: ["status"],
  excess: [],
};

export type FilterValues = Record<string, string>;

export interface RecordFilterState {
  /** The tab that was open last. */
  tab: RecordTab;
  shared: Record<SharedFilterKey, string>;
  tabs: Record<RecordTab, FilterValues>;
}

const MAX_VALUE_LENGTH = 100;

function emptyTabs(): Record<RecordTab, FilterValues> {
  return { sales: {}, gcash: {}, expenses: {}, debts: {}, excess: {} };
}

export function createEmptyFilterState(): RecordFilterState {
  return { tab: DEFAULT_RECORD_TAB, shared: { q: "", from: "", to: "" }, tabs: emptyTabs() };
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, MAX_VALUE_LENGTH) : "";
}

function cleanDate(value: unknown): string {
  const text = cleanText(value);
  return text && isValidDateInput(text) ? text : "";
}

/** Anything read from localStorage is untrusted: keep only known keys with sane values. */
export function sanitizeFilterState(raw: unknown): RecordFilterState {
  const state = createEmptyFilterState();
  if (!raw || typeof raw !== "object") return state;
  const input = raw as { tab?: unknown; shared?: Record<string, unknown>; tabs?: Record<string, Record<string, unknown>> };

  state.tab = parseRecordTab(typeof input.tab === "string" ? input.tab : undefined);
  state.shared = { q: cleanText(input.shared?.q), from: cleanDate(input.shared?.from), to: cleanDate(input.shared?.to) };
  for (const tab of RECORD_TABS) {
    for (const key of TAB_FILTER_KEYS[tab]) {
      const value = cleanText(input.tabs?.[tab]?.[key]);
      if (value) state.tabs[tab][key] = value;
    }
  }
  return state;
}

/** Filters currently in effect for one tab (shared + that tab's own), empty values left out. */
export function activeValues(state: RecordFilterState, tab: RecordTab): FilterValues {
  const values: FilterValues = {};
  for (const key of SHARED_FILTER_KEYS) if (state.shared[key]) values[key] = state.shared[key];
  for (const key of TAB_FILTER_KEYS[tab]) if (state.tabs[tab][key]) values[key] = state.tabs[tab][key];
  return values;
}

export function hasActiveFilters(state: RecordFilterState, tab: RecordTab): boolean {
  return Object.keys(activeValues(state, tab)).length > 0;
}

/** Query string ("tab=gcash&q=abc") for opening a tab with its remembered filters. */
export function buildRecordsQuery(state: RecordFilterState, tab: RecordTab): string {
  const search = new URLSearchParams();
  search.set("tab", tab);
  for (const [key, value] of Object.entries(activeValues(state, tab))) search.set(key, value);
  return search.toString();
}

export function recordsHrefFor(state: RecordFilterState, tab: RecordTab): string {
  return `/records?${buildRecordsQuery(state, tab)}`;
}

/** Does this URL carry any filter for the tab? If so the URL wins over what was remembered. */
export function urlHasFilters(params: URLSearchParams, tab: RecordTab): boolean {
  return [...SHARED_FILTER_KEYS, ...TAB_FILTER_KEYS[tab]].some((key) => Boolean(params.get(key)?.trim()));
}

/** The state after the user applies filters for a tab. Shared parts replace the old ones everywhere. */
export function applyFilters(state: RecordFilterState, tab: RecordTab, values: FilterValues): RecordFilterState {
  const next = sanitizeFilterState({
    tab,
    shared: { q: values.q, from: values.from, to: values.to },
    tabs: { ...state.tabs, [tab]: Object.fromEntries(TAB_FILTER_KEYS[tab].map((key) => [key, values[key]])) },
  });
  return next;
}

/** Clears the shared filters and the given tab's own filters. Other tabs keep theirs. */
export function clearFilters(state: RecordFilterState, tab: RecordTab): RecordFilterState {
  return { ...state, tab, shared: { q: "", from: "", to: "" }, tabs: { ...state.tabs, [tab]: {} } };
}

/** Remember the filters that arrived in the URL (a shared link, a bookmark, a dashboard link). */
export function stateFromUrl(state: RecordFilterState, params: URLSearchParams, tab: RecordTab): RecordFilterState {
  const values: FilterValues = {};
  for (const key of [...SHARED_FILTER_KEYS, ...TAB_FILTER_KEYS[tab]]) values[key] = params.get(key) ?? "";
  return applyFilters(state, tab, values);
}

/**
 * What to do when the Records page opens:
 *  - URL already has filters -> keep it, and remember those filters;
 *  - otherwise, fill the URL from the remembered ones (and the remembered tab if none given).
 * Returns the new query string to navigate to, or null to stay where we are.
 */
export function restoreQuery(state: RecordFilterState, params: URLSearchParams): string | null {
  const hasTab = params.has("tab");
  const tab = hasTab ? parseRecordTab(params.get("tab")) : state.tab;
  if (urlHasFilters(params, tab)) return null;

  const stored = activeValues(state, tab);
  const missing = Object.entries(stored);
  if (missing.length === 0 && hasTab) return null;
  if (missing.length === 0 && tab === DEFAULT_RECORD_TAB) return null;

  const next = new URLSearchParams(params);
  next.set("tab", tab);
  for (const [key, value] of missing) next.set(key, value);
  next.delete("page");
  return next.toString();
}
