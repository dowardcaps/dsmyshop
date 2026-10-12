type RawParams = Record<string, string | string[] | undefined>;

const DIALOG_PARAMS = ["new", "edit"] as const;

export interface InventoryHrefs {
  /** The page without a dialog (keeps search, level and page). */
  closeHref: string;
  addHref: string;
  editHref: (id: string) => string;
  pageHref: (page: number) => string;
  clearHref: string;
}

/** Links for /inventory that keep the search and level filter. */
export function createInventoryHrefs(params: RawParams): InventoryHrefs {
  const base = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if ((DIALOG_PARAMS as readonly string[]).includes(key)) continue;
    const first = Array.isArray(value) ? value[0] : value;
    if (first) base.set(key, first);
  }
  const asHref = (search: URLSearchParams) => (search.toString() ? `/inventory?${search.toString()}` : "/inventory");
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
    clearHref: "/inventory",
  };
}
