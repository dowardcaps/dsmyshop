/** "YYYY-MM" helpers. Pure, so they work on the server and in the browser. */

export const isMonthKey = (value: string): boolean =>
  /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

export function addMonths(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const index = y * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

export const previousMonth = (ym: string): string => addMonths(ym, -1);

export function daysInMonth(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export const monthBounds = (ym: string): { from: string; to: string } => ({
  from: `${ym}-01`,
  to: `${ym}-${String(daysInMonth(ym)).padStart(2, "0")}`,
});

export function monthLabel(ym: string, short = false): string {
  const [y, m] = ym.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PH", {
    month: short ? "short" : "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

/** Last `count` months ending at `ym`, oldest first. */
export const monthsEndingAt = (ym: string, count: number): string[] =>
  Array.from({ length: count }, (_, i) => addMonths(ym, i - (count - 1)));
