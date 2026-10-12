import { STOCK_LEVEL_LABELS, type StockLevel } from "@/lib/inventory/stock";
import { cn } from "@/lib/utils";

/** Color AND a word, so the level is clear without relying on color alone. */
const STYLES: Record<StockLevel, { badge: string; dot: string }> = {
  low: { badge: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300", dot: "bg-red-500" },
  medium: { badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300", dot: "bg-amber-500" },
  high: { badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300", dot: "bg-emerald-500" },
};

export function StockBadge({ level, className }: { level: StockLevel; className?: string }) {
  const style = STYLES[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", style.badge, className)} data-level={level}>
      <span className={cn("size-1.5 rounded-full", style.dot)} aria-hidden />
      {STOCK_LEVEL_LABELS[level]}
    </span>
  );
}

export const STOCK_ROW_ACCENT: Record<StockLevel, string> = {
  low: "border-l-4 border-l-red-500",
  medium: "border-l-4 border-l-amber-500",
  high: "border-l-4 border-l-emerald-500",
};
