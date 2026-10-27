"use client";

import { createContext, useContext } from "react";

import type { Checkout } from "@/hooks/use-checkout";
import type { TransactionCart } from "@/hooks/use-transaction-cart";

export interface PosState {
  cart: TransactionCart;
  checkout: Checkout;
  /** Opens the "Clear this order?" question. */
  askReset: () => void;
}

export const PosContext = createContext<PosState | null>(null);

/** The open order (tabs, items, sale details). Shared by the POS page and the Manage services page. */
export function usePos(): PosState {
  const state = useContext(PosContext);
  if (!state) throw new Error("usePos must be used inside PosShell");
  return state;
}
