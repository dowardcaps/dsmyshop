export const SHOP_DAY_STATUSES = ["OPEN", "HALF_DAY", "CLOSED"] as const;
export type ShopDayStatusValue = (typeof SHOP_DAY_STATUSES)[number];

export const SHOP_DAY_LABELS: Record<ShopDayStatusValue, string> = {
  OPEN: "Open",
  HALF_DAY: "Half day",
  CLOSED: "Closed",
};

/** Green = open, yellow = half day, red = closed. A day with no status stays neutral. */
export const SHOP_DAY_STYLES: Record<
  ShopDayStatusValue,
  { cell: string; dot: string; chip: string }
> = {
  OPEN: {
    cell: "border-green-500/60 bg-green-100 text-green-950 dark:bg-green-950/50 dark:text-green-100",
    dot: "bg-green-500",
    chip: "border-green-500 bg-green-100 text-green-900 dark:bg-green-950/60 dark:text-green-100",
  },
  HALF_DAY: {
    cell: "border-yellow-500/70 bg-yellow-100 text-yellow-950 dark:bg-yellow-950/50 dark:text-yellow-100",
    dot: "bg-yellow-400",
    chip: "border-yellow-500 bg-yellow-100 text-yellow-900 dark:bg-yellow-950/60 dark:text-yellow-100",
  },
  CLOSED: {
    cell: "border-red-500/60 bg-red-100 text-red-950 dark:bg-red-950/50 dark:text-red-100",
    dot: "bg-red-500",
    chip: "border-red-500 bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-100",
  },
};

/** Longest range that can be set in one go (about two months). */
export const MAX_RANGE_DAYS = 62;

/** Weekdays that count as closed unless the owner sets that day otherwise (0 = Sunday). */
export const DEFAULT_CLOSED_WEEKDAYS: readonly number[] = [0];
