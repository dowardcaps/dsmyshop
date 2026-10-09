"use client";

/**
 * Browser-side store for the Records filters (localStorage). Built for useSyncExternalStore:
 * the server and the first client render both see the empty state, so there is no hydration
 * mismatch; remembered filters appear right after hydration.
 */

import { createEmptyFilterState, sanitizeFilterState, type RecordFilterState } from "@/lib/records/filter-state";

const STORAGE_KEY = "dsfinance_record_filters_v1";
const SERVER_STATE = createEmptyFilterState();

let state: RecordFilterState = SERVER_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function readStored(): RecordFilterState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeFilterState(JSON.parse(raw)) : createEmptyFilterState();
  } catch {
    return createEmptyFilterState();
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

export function getSnapshot(): RecordFilterState {
  ensureLoaded();
  return state;
}

export function getServerSnapshot(): RecordFilterState {
  return SERVER_STATE;
}

/** Applies a pure update from filter-state.ts, saves it, and tells React. */
export function updateFilterState(update: (current: RecordFilterState) => RecordFilterState): void {
  ensureLoaded();
  const next = update(state);
  if (JSON.stringify(next) === JSON.stringify(state)) return;
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage blocked: filters still work for this page view */
  }
  emit();
}
