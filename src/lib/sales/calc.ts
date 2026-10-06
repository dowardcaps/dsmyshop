/**
 * Sale money math in integer centavos, so there is no floating point drift.
 * Shared by the form's live total and by the server, which recalculates every
 * total itself and never trusts figures sent by the client.
 */

import { toCents } from "@/lib/cents";

export { centsToAmount, centsToDecimalString, toCents } from "@/lib/cents";

export interface PricedItem {
  quantity: number;
  unitPrice: number;
}

export function lineSubtotalCents(item: PricedItem): number {
  if (!Number.isFinite(item.quantity) || !Number.isFinite(item.unitPrice)) return 0;
  return item.quantity * toCents(item.unitPrice);
}

export function saleTotalCents(items: readonly PricedItem[]): number {
  return items.reduce((total, item) => total + lineSubtotalCents(item), 0);
}

