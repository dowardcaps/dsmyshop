/** Quick date ranges for the Records filter bar. Pure logic, safe for the browser and the server. */

import { parseDateInput, toDateInputValue } from "@/lib/dates";

export const DATE_PRESETS = ["today", "yesterday", "last7", "last28"] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7: "Last 7 days",
  last28: "Last 28 days",
};

/** "2026-10-10" minus N days, as "YYYY-MM-DD". Calendar math at UTC midnight, so no DST surprises. */
export function shiftDate(date: string, days: number): string {
  const result = parseDateInput(date);
  result.setUTCDate(result.getUTCDate() + days);
  return toDateInputValue(result);
}

/** The From/To dates for a preset. "Last 7 days" includes today (today and the 6 days before it). */
export function presetRange(preset: DatePreset, today: string): { from: string; to: string } {
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const day = shiftDate(today, -1);
      return { from: day, to: day };
    }
    case "last7":
      return { from: shiftDate(today, -6), to: today };
    case "last28":
      return { from: shiftDate(today, -27), to: today };
  }
}

/** Which preset the current From/To match, if any (used to highlight the button). */
export function matchingPreset(from: string, to: string, today: string): DatePreset | null {
  if (!from || !to) return null;
  return DATE_PRESETS.find((preset) => {
    const range = presetRange(preset, today);
    return range.from === from && range.to === to;
  }) ?? null;
}
