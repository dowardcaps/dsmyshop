"use client";

/**
 * Browser-side store for the calculator tabs. Open transactions are work in progress, so they
 * stay in this browser's localStorage (surviving a refresh) and only become data in the database
 * when the sale is saved. Built for useSyncExternalStore: the server and the first client render
 * both see the same empty state, so there is no hydration mismatch.
 */

import { createInitialState, sanitizeState, type CartState } from "@/lib/transactions/cart";

const STORAGE_KEY = "dsfinance_transactions_v1";
const SERVER_STATE = createInitialState();

let state: CartState = SERVER_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function readStored(): CartState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeState(JSON.parse(raw)) : createInitialState();
  } catch {
    return createInitialState();
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  state = readStored();
}

function emit() {
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  state = readStored();
  emit();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function getSnapshot(): CartState {
  ensureLoaded();
  return state;
}

export function getServerSnapshot(): CartState {
  return SERVER_STATE;
}

/** Applies a pure update from cart.ts, saves it, and tells React. */
export function updateCartState(update: (current: CartState) => CartState): void {
  ensureLoaded();
  const next = update(state);
  if (next === state) return;
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: the cart still works until the page is closed */
  }
  emit();
}
