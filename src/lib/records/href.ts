import type { RecordTab } from "@/lib/records/tabs";

type RawParams = Record<string, string | string[] | undefined>;

/** Params that open a form dialog; they never belong in a "close" or "page" link. */
const DIALOG_PARAMS = ["new", "edit"] as const;

export interface RecordHrefs {
  /** The page without any open dialog (keeps tab, filters and page). */
  closeHref: string;
  addHref: string;
  editHref: (id: string) => string;
  pageHref: (page: number) => string;
  /** Same tab and filters, back on page 1. */
  clearHref: string;
}

function toSearch(params: RawParams, drop: readonly string[]): URLSearchParams {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (drop.includes(key)) continue;
    const first = Array.isArray(value) ? value[0] : value;
    if (first) search.set(key, first);
  }
  return search;
}

const asHref = (search: URLSearchParams) => {
  const query = search.toString();
  return query ? `/records?${query}` : "/records";
};

export function createRecordHrefs(tab: RecordTab, params: RawParams): RecordHrefs {
  const base = toSearch(params, DIALOG_PARAMS);
  base.set("tab", tab);

  const withExtra = (key: string, value: string) => {
    const next = new URLSearchParams(base);
    next.set(key, value);
    return asHref(next);
  };

  return {
    closeHref: asHref(base),
    addHref: withExtra("new", "1"),
    editHref: (id) => withExtra("edit", id),
    pageHref: (page) => {
      const next = new URLSearchParams(base);
      if (page > 1) next.set("page", String(page));
      else next.delete("page");
      return asHref(next);
    },
    clearHref: `/records?tab=${tab}`,
  };
}

/** Where an old page now lives. */
export const recordsTabHref = (tab: RecordTab) => `/records?tab=${tab}`;
export const recordsEditHref = (tab: RecordTab, id: string) => `/records?tab=${tab}&edit=${id}`;
export const recordsNewHref = (tab: RecordTab) => `/records?tab=${tab}&new=1`;
