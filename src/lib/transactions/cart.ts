/**
 * Pure calculator logic: tabs, quantities, totals and the Excel summary text.
 * No React and no browser APIs here, so it can be tested on its own.
 */

import { toCents } from "@/lib/cents";
import { MAX_QUANTITY, SERVICES_PER_PAGE } from "@/lib/transactions/constants";

export interface PosService {
  id: string;
  name: string;
  price: number;
  categoryName: string;
}

export interface CartTab {
  id: string;
  name: string;
  /** serviceId -> quantity (only quantities above zero are stored). */
  cart: Record<string, number>;
  searchTerm: string;
  page: number;
}

export interface CartState {
  tabs: CartTab[];
  activeId: string;
}

export const INITIAL_TAB_ID = "tab-initial";

export function createInitialState(): CartState {
  return {
    tabs: [{ id: INITIAL_TAB_ID, name: "Transaction 1", cart: {}, searchTerm: "", page: 1 }],
    activeId: INITIAL_TAB_ID,
  };
}

/** Smallest positive number not already used by a "Transaction N" tab, so closed numbers get reused. */
export function nextTabNumber(names: readonly string[]): number {
  const used = new Set<number>();
  for (const name of names) {
    const match = name.match(/(\d+)\s*$/);
    if (match) used.add(Number(match[1]));
  }
  let n = 1;
  while (used.has(n)) n++;
  return n;
}

/** Accepts whatever was saved in localStorage and returns a safe state (or a fresh one). */
export function sanitizeState(raw: unknown): CartState {
  if (!raw || typeof raw !== "object") return createInitialState();
  const value = raw as { tabs?: unknown; activeId?: unknown };
  if (!Array.isArray(value.tabs)) return createInitialState();

  const tabs: CartTab[] = [];
  for (const entry of value.tabs) {
    if (!entry || typeof entry !== "object") continue;
    const tab = entry as Partial<CartTab>;
    if (typeof tab.id !== "string" || !tab.id) continue;
    const cart: Record<string, number> = {};
    if (tab.cart && typeof tab.cart === "object") {
      for (const [serviceId, qty] of Object.entries(tab.cart)) {
        if (typeof qty === "number" && Number.isInteger(qty) && qty > 0) cart[serviceId] = Math.min(qty, MAX_QUANTITY);
      }
    }
    tabs.push({
      id: tab.id,
      name: typeof tab.name === "string" && tab.name ? tab.name : `Transaction ${nextTabNumber(tabs.map((t) => t.name))}`,
      cart,
      searchTerm: typeof tab.searchTerm === "string" ? tab.searchTerm : "",
      page: typeof tab.page === "number" && tab.page >= 1 ? Math.floor(tab.page) : 1,
    });
  }
  if (tabs.length === 0) return createInitialState();
  const activeId = tabs.some((t) => t.id === value.activeId) ? (value.activeId as string) : tabs[0].id;
  return { tabs, activeId };
}

function updateActive(state: CartState, patch: (tab: CartTab) => CartTab): CartState {
  return { ...state, tabs: state.tabs.map((tab) => (tab.id === state.activeId ? patch(tab) : tab)) };
}

export function addTab(state: CartState, id: string): CartState {
  const name = `Transaction ${nextTabNumber(state.tabs.map((t) => t.name))}`;
  return { tabs: [...state.tabs, { id, name, cart: {}, searchTerm: "", page: 1 }], activeId: id };
}

export function selectTab(state: CartState, id: string): CartState {
  return state.tabs.some((t) => t.id === id) && id !== state.activeId ? { ...state, activeId: id } : state;
}

/** The last remaining tab cannot be closed. */
export function removeTab(state: CartState, id: string): CartState {
  if (state.tabs.length <= 1) return state;
  const index = state.tabs.findIndex((t) => t.id === id);
  if (index === -1) return state;
  const tabs = state.tabs.filter((t) => t.id !== id);
  const activeId = state.activeId === id ? tabs[Math.min(index, tabs.length - 1)].id : state.activeId;
  return { tabs, activeId };
}

export function setQuantity(state: CartState, serviceId: string, quantity: number): CartState {
  const qty = Number.isFinite(quantity) ? Math.min(Math.max(Math.floor(quantity), 0), MAX_QUANTITY) : 0;
  return updateActive(state, (tab) => {
    const cart = { ...tab.cart };
    if (qty <= 0) delete cart[serviceId];
    else cart[serviceId] = qty;
    return { ...tab, cart };
  });
}

export function changeQuantity(state: CartState, serviceId: string, delta: number): CartState {
  const active = state.tabs.find((t) => t.id === state.activeId);
  return setQuantity(state, serviceId, (active?.cart[serviceId] ?? 0) + delta);
}

export function setSearchTerm(state: CartState, term: string): CartState {
  return updateActive(state, (tab) => ({ ...tab, searchTerm: term, page: 1 }));
}

export function setPage(state: CartState, page: number): CartState {
  return updateActive(state, (tab) => ({ ...tab, page: Math.max(1, Math.floor(page)) }));
}

/** Empties the active cart and its search box (used by Reset and after a sale is saved). */
export function clearActiveCart(state: CartState): CartState {
  return updateActive(state, (tab) => ({ ...tab, cart: {}, searchTerm: "", page: 1 }));
}

export function filterServices(services: readonly PosService[], term: string): PosService[] {
  const needle = term.trim().toLowerCase();
  const matches = needle
    ? services.filter((s) => s.name.toLowerCase().includes(needle) || s.categoryName.toLowerCase().includes(needle))
    : [...services];
  return matches.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
}

export function paginate<T>(rows: readonly T[], page: number, perPage = SERVICES_PER_PAGE) {
  const pageCount = Math.max(1, Math.ceil(rows.length / perPage));
  const current = Math.min(Math.max(page, 1), pageCount);
  return { rows: rows.slice((current - 1) * perPage, current * perPage), page: current, pageCount };
}

/** "₱5.00": the same format the Excel sales log already uses. */
export function summaryPeso(amount: number): string {
  return `₱${amount.toFixed(2)}`;
}

export interface SummaryLine {
  serviceId: string;
  text: string;
}

export interface SummaryGroup {
  category: string;
  lines: SummaryLine[];
}

export interface CartSummary {
  groups: SummaryGroup[];
  itemCount: number;
  totalCents: number;
  /** What actually gets saved: only services that still exist. */
  items: { serviceId: string; quantity: number }[];
}

export function summarizeCart(services: readonly PosService[], cart: Record<string, number>): CartSummary {
  const byCategory = new Map<string, SummaryLine[]>();
  const items: CartSummary["items"] = [];
  let itemCount = 0;
  let totalCents = 0;

  for (const service of services) {
    const quantity = cart[service.id] ?? 0;
    if (quantity <= 0) continue;
    const lineCents = toCents(service.price) * quantity;
    totalCents += lineCents;
    itemCount += quantity;
    items.push({ serviceId: service.id, quantity });
    const lines = byCategory.get(service.categoryName) ?? [];
    lines.push({
      serviceId: service.id,
      text: `${service.name} - ${quantity} x ${summaryPeso(service.price)} = ${summaryPeso(lineCents / 100)}`,
    });
    byCategory.set(service.categoryName, lines);
  }

  const groups = [...byCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, lines]) => ({ category, lines }));
  return { groups, itemCount, totalCents, items };
}

/** The multi-line "[Printing] ..." text, same layout as the original Copy Summary. */
export function buildSummaryText(groups: readonly SummaryGroup[]): string {
  return groups.map((g) => `[${g.category}]\n${g.lines.map((l) => l.text).join("\n")}`).join("\n\n");
}

/** One "Details <tab> Amount" row that pastes into Excel as two columns (details stay in one cell). */
export function toExcelRow(details: string, totalCents: number): string {
  const amount = String(Math.round(totalCents) / 100);
  return `"${details.replace(/"/g, '""')}"\t${amount}`;
}

/** Change to hand back, in centavos. Never negative. */
export function changeCents(cashCents: number, totalCents: number): number {
  return Math.max(0, cashCents - totalCents);
}
