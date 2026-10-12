/** Pure inventory rules. Safe for the browser and the server. */

export const STOCK_LEVELS = ["low", "medium", "high"] as const;
export type StockLevel = (typeof STOCK_LEVELS)[number];

export const STOCK_LEVEL_LABELS: Record<StockLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

/** At or below `low` = low; at or above `high` = high; anything between = medium. */
export function stockLevel(quantity: number, lowLevel: number, highLevel: number): StockLevel {
  if (quantity <= lowLevel) return "low";
  if (quantity >= highLevel) return "high";
  return "medium";
}

/**
 * Sales of these are NOT subtracted from stock automatically: printing and xerox use paper, and paper is
 * also lost to printer trouble and misprints, so the owner adjusts bond paper by hand.
 */
export const EXEMPT_CATEGORIES = ["Printing", "Xerox"] as const;

const BOND_PAPER = /bond\s*paper/i;

export function isExemptFromAutoDeduct(categoryName: string, serviceName: string): boolean {
  const category = categoryName.trim().toLowerCase();
  if (EXEMPT_CATEGORIES.some((name) => name.toLowerCase() === category)) return true;
  return BOND_PAPER.test(serviceName);
}

/** What is left after selling `sold`. Selling more than the stock never blocks a sale; stock stops at 0. */
export const stockAfterSale = (quantity: number, sold: number): number => Math.max(0, quantity - sold);
