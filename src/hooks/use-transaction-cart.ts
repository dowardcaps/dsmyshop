"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  addTab,
  changeQuantity,
  clearActiveCart,
  filterServices,
  paginate,
  removeTab,
  selectTab,
  setPage,
  setQuantity,
  setSearchTerm,
  summarizeCart,
  type PosService,
} from "@/lib/transactions/cart";
import { getServerSnapshot, getSnapshot, subscribe, updateCartState } from "@/lib/transactions/cart-store";

function newTabId(): string {
  return `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** The open transactions (tabs), the active cart, its totals, and the visible page of services. */
export function useTransactionCart(services: readonly PosService[]) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const active = state.tabs.find((tab) => tab.id === state.activeId) ?? state.tabs[0];

  const summary = useMemo(() => summarizeCart(services, active.cart), [services, active.cart]);
  const filtered = useMemo(() => filterServices(services, active.searchTerm), [services, active.searchTerm]);
  const pageData = useMemo(() => paginate(filtered, active.page), [filtered, active.page]);

  return {
    tabs: state.tabs,
    active,
    summary,
    visibleServices: pageData.rows,
    page: pageData.page,
    pageCount: pageData.pageCount,
    quantityOf: useCallback((serviceId: string) => active.cart[serviceId] ?? 0, [active.cart]),
    selectTab: useCallback((id: string) => updateCartState((s) => selectTab(s, id)), []),
    addTab: useCallback(() => updateCartState((s) => addTab(s, newTabId())), []),
    removeTab: useCallback((id: string) => updateCartState((s) => removeTab(s, id)), []),
    setQuantity: useCallback((serviceId: string, qty: number) => updateCartState((s) => setQuantity(s, serviceId, qty)), []),
    changeQuantity: useCallback((serviceId: string, delta: number) => updateCartState((s) => changeQuantity(s, serviceId, delta)), []),
    setSearchTerm: useCallback((term: string) => updateCartState((s) => setSearchTerm(s, term)), []),
    setPage: useCallback((page: number) => updateCartState((s) => setPage(s, page)), []),
    clearCart: useCallback(() => updateCartState(clearActiveCart), []),
  };
}

export type TransactionCart = ReturnType<typeof useTransactionCart>;
