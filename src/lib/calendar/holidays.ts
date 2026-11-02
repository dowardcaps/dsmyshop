/**
 * Philippine national holidays for the Calendar. Pure logic, no database.
 *
 * Fixed-date and Easter-based holidays are worked out for any year. A few holidays are set by
 * proclamation each year and cannot be calculated: Chinese New Year is listed per year below, and
 * Eid'l Fitr / Eid'l Adha are NOT built in (the Palace only announces them close to the date).
 * Add those, or any extra day, in EXTRA_HOLIDAYS.
 *
 * "Special working day" proclamations (for example the EDSA anniversary) are not days off, so they are not listed.
 * Source for 2026: the Palace's official list of 2026 holidays.
 */

export type HolidayKind = "REGULAR" | "SPECIAL";

export interface Holiday {
  name: string;
  kind: HolidayKind;
}

export const HOLIDAY_KIND_LABELS: Record<HolidayKind, string> = {
  REGULAR: "Regular holiday",
  SPECIAL: "Special non-working day",
};

/** Days announced by proclamation (Eid'l Fitr, Eid'l Adha, one-off days). "YYYY-MM-DD" -> holiday. Edit this list when the Palace announces them. */
export const EXTRA_HOLIDAYS: Record<string, Holiday> = {};

/** Chinese New Year, usually declared a special non-working day. */
const CHINESE_NEW_YEAR: Record<number, string> = {
  2024: "02-10",
  2025: "01-29",
  2026: "02-17",
  2027: "02-06",
  2028: "01-26",
  2029: "02-13",
  2030: "02-03",
};

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/** Easter Sunday (Gregorian), as [month, day]. */
export function easterSunday(year: number): [number, number] {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return [month, day];
}

function shiftDays(date: string, delta: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Last Monday of August (National Heroes Day). */
function lastMondayOfAugust(year: number): string {
  const lastDay = new Date(Date.UTC(year, 8, 0)).getUTCDate();
  const weekday = new Date(Date.UTC(year, 7, lastDay)).getUTCDay();
  return iso(year, 8, lastDay - ((weekday + 6) % 7));
}

/** Every holiday of one year, keyed by "YYYY-MM-DD". */
export function holidaysOfYear(year: number): Map<string, Holiday> {
  const map = new Map<string, Holiday>();
  const add = (date: string, name: string, kind: HolidayKind) =>
    map.set(date, { name, kind });

  add(iso(year, 1, 1), "New Year's Day", "REGULAR");
  add(iso(year, 4, 9), "Araw ng Kagitingan", "REGULAR");
  add(iso(year, 5, 1), "Labor Day", "REGULAR");
  add(iso(year, 6, 12), "Independence Day", "REGULAR");
  add(lastMondayOfAugust(year), "National Heroes Day", "REGULAR");
  add(iso(year, 11, 30), "Bonifacio Day", "REGULAR");
  add(iso(year, 12, 25), "Christmas Day", "REGULAR");
  add(iso(year, 12, 30), "Rizal Day", "REGULAR");

  const [em, ed] = easterSunday(year);
  const easter = iso(year, em, ed);
  add(shiftDays(easter, -3), "Maundy Thursday", "REGULAR");
  add(shiftDays(easter, -2), "Good Friday", "REGULAR");
  add(shiftDays(easter, -1), "Black Saturday", "SPECIAL");

  add(iso(year, 8, 21), "Ninoy Aquino Day", "SPECIAL");
  add(iso(year, 11, 1), "All Saints' Day", "SPECIAL");
  add(iso(year, 11, 2), "All Souls' Day", "SPECIAL");
  add(iso(year, 12, 8), "Feast of the Immaculate Conception", "SPECIAL");
  add(iso(year, 12, 24), "Christmas Eve", "SPECIAL");
  add(iso(year, 12, 31), "Last Day of the Year", "SPECIAL");

  const cny = CHINESE_NEW_YEAR[year];
  if (cny) add(`${year}-${cny}`, "Chinese New Year", "SPECIAL");

  for (const [date, holiday] of Object.entries(EXTRA_HOLIDAYS))
    if (date.startsWith(`${year}-`)) map.set(date, holiday);
  return map;
}

/** Holidays that fall in one month ("YYYY-MM"), keyed by date. */
export function holidaysOfMonth(month: string): Map<string, Holiday> {
  const year = Number(month.slice(0, 4));
  return new Map(
    [...holidaysOfYear(year)].filter(([date]) => date.startsWith(`${month}-`)),
  );
}
