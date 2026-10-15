import {
  DEFAULT_CLOSED_WEEKDAYS,
  type ShopDayStatusValue,
} from "@/lib/calendar/constants";
import { daysInMonth } from "@/lib/calendar/grid";

/** A day as the calendar shows it: its own status, or the default for that weekday. */
export interface ResolvedDay {
  date: string;
  status: ShopDayStatusValue;
  note: string | null;
  /** True when nothing was saved for the day and the weekday default applies (Sundays closed). */
  isDefault: boolean;
}

/** The status a weekday gets when nothing is saved for it, or undefined for "not set". */
export function defaultStatusFor(date: string): ShopDayStatusValue | undefined {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return DEFAULT_CLOSED_WEEKDAYS.includes(weekday) ? "CLOSED" : undefined;
}

/** Every day of the month that has a status: the saved ones, plus weekday defaults for the rest. Pure. */
export function resolveMonth(
  month: string,
  saved: ReadonlyMap<
    string,
    { status: ShopDayStatusValue; note: string | null }
  >,
): Map<string, ResolvedDay> {
  const resolved = new Map<string, ResolvedDay>();
  for (let day = 1; day <= daysInMonth(month); day += 1) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    const row = saved.get(date);
    if (row) {
      resolved.set(date, {
        date,
        status: row.status,
        note: row.note,
        isDefault: false,
      });
      continue;
    }
    const status = defaultStatusFor(date);
    if (status)
      resolved.set(date, { date, status, note: null, isDefault: true });
  }
  return resolved;
}
