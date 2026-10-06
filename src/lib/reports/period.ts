import { isValidDateInput } from "@/lib/dates";
import { MONTH_NAMES } from "@/lib/dashboard/period";
import { firstParam, type RawSearchParams } from "@/lib/validation/filter-utils";
import {
  MAX_REPORT_MONTHS,
  REPORT_MODES,
  REPORT_TYPES,
  type DateRange,
  type ReportMode,
  type ReportSelection,
  type ReportType,
} from "@/lib/reports/types";

const MONTH_KEY = /^(\d{4})-(0[1-9]|1[0-2])$/;
const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

export type ParsedReportParams =
  | { status: "idle" }
  | { status: "error"; error: string; selection: ReportSelection }
  | { status: "ready"; selection: ReportSelection };

const pad = (value: number) => String(value).padStart(2, "0");

export function isMonthKey(value: string): boolean {
  const match = MONTH_KEY.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  return year >= MIN_YEAR && year <= MAX_YEAR;
}

export const monthKey = (year: number, month: number) => `${year}-${pad(month)}`;

export function splitMonthKey(key: string): { year: number; month: number } {
  const [year, month] = key.split("-").map(Number);
  return { year, month };
}

export function monthName(key: string): string {
  return MONTH_NAMES[splitMonthKey(key).month - 1];
}

export function monthLabel(key: string): string {
  return `${monthName(key)} ${splitMonthKey(key).year}`;
}

export function monthRange(key: string): DateRange {
  const { year, month } = splitMonthKey(key);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${key}-01`, to: `${key}-${pad(lastDay)}` };
}

/** Every month key from start to end, inclusive. Empty when start is after end. */
export function monthsBetween(start: string, end: string): string[] {
  if (start > end) return [];
  const out: string[] = [];
  let { year, month } = splitMonthKey(start);
  const last = splitMonthKey(end);
  while (year < last.year || (year === last.year && month <= last.month)) {
    out.push(monthKey(year, month));
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    if (out.length > MAX_REPORT_MONTHS + 1) break;
  }
  return out;
}

const uniqueSorted = (values: string[]) => [...new Set(values)].sort();

function parseCsv(value: string | string[] | undefined): string[] {
  return (firstParam(value) ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Reads the report selection from the URL.
 *   ?mode=months&months=2026-02,2026-03
 *   ?mode=range&start=2026-02&end=2026-09
 *   ?mode=dates&from=2026-09-01&to=2026-09-15
 *   &types=sales,expenses   (omit for everything)
 * No `mode` means the form has not been submitted yet ("idle").
 */
export function parseReportParams(params: RawSearchParams): ParsedReportParams {
  const modeRaw = firstParam(params.mode);
  const mode = REPORT_MODES.find((item) => item === modeRaw) as ReportMode | undefined;
  if (!mode) return { status: "idle" };

  const base: ReportSelection = { mode, months: [], from: null, to: null, types: [...REPORT_TYPES] };
  const fail = (error: string, patch: Partial<ReportSelection> = {}) =>
    ({ status: "error", error, selection: { ...base, ...patch } }) as const;

  // transaction types
  let types: ReportType[] = [...REPORT_TYPES];
  if (params.types !== undefined) {
    const requested = parseCsv(params.types);
    types = REPORT_TYPES.filter((type) => requested.includes(type));
    if (types.length === 0) return fail("Select at least one transaction type to include.");
  }
  base.types = types;

  if (mode === "months") {
    const months = uniqueSorted(parseCsv(params.months).filter(isMonthKey));
    if (months.length === 0) return fail("Select at least one month to generate a report.");
    if (months.length > MAX_REPORT_MONTHS) return fail(`Select at most ${MAX_REPORT_MONTHS} months.`, { months });
    return { status: "ready", selection: { ...base, months } };
  }

  if (mode === "range") {
    const start = firstParam(params.start);
    const end = firstParam(params.end);
    if (!start || !end || !isMonthKey(start) || !isMonthKey(end)) {
      return fail("Choose both a start month and an end month.");
    }
    if (start > end) return fail("The start month must be the same as or before the end month.");
    const months = monthsBetween(start, end);
    if (months.length > MAX_REPORT_MONTHS) return fail(`Select a range of at most ${MAX_REPORT_MONTHS} months.`);
    return { status: "ready", selection: { ...base, months } };
  }

  const from = firstParam(params.from);
  const to = firstParam(params.to);
  if (!from || !to || !isValidDateInput(from) || !isValidDateInput(to)) {
    return fail("Enter both a valid start date and end date.", { from: from ?? null, to: to ?? null });
  }
  if (from > to) return fail("The start date must be the same as or before the end date.", { from, to });
  if (monthsBetween(from.slice(0, 7), to.slice(0, 7)).length > MAX_REPORT_MONTHS) {
    return fail(`The date range can cover at most ${MAX_REPORT_MONTHS} months.`, { from, to });
  }
  return { status: "ready", selection: { ...base, from, to } };
}

/** Inclusive date ranges to query. Adjacent months are merged into one range. */
export function selectionRanges(selection: ReportSelection): DateRange[] {
  if (selection.mode === "dates") {
    return selection.from && selection.to ? [{ from: selection.from, to: selection.to }] : [];
  }
  const ranges: DateRange[] = [];
  for (const key of uniqueSorted(selection.months)) {
    const range = monthRange(key);
    const last = ranges[ranges.length - 1];
    const nextDay = last ? new Date(Date.parse(`${last.to}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10) : null;
    if (last && nextDay === range.from) last.to = range.to;
    else ranges.push({ ...range });
  }
  return ranges;
}

/** Calendar months that contain at least one selected day, in order. */
export function selectionMonthKeys(selection: ReportSelection): string[] {
  if (selection.mode === "dates" && selection.from && selection.to) {
    return monthsBetween(selection.from.slice(0, 7), selection.to.slice(0, 7));
  }
  return uniqueSorted(selection.months);
}

const isContiguous = (months: string[]) => months.length > 0 && monthsBetween(months[0], months[months.length - 1]).length === months.length;

function formatShortDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${MONTH_NAMES[month - 1].slice(0, 3)} ${day}, ${year}`;
}

/** "February – October 2026", "February, April 2026", "Sep 1, 2026 – Sep 15, 2026". */
export function selectionLabel(selection: ReportSelection): string {
  if (selection.mode === "dates" && selection.from && selection.to) {
    return selection.from === selection.to
      ? formatShortDate(selection.from)
      : `${formatShortDate(selection.from)} – ${formatShortDate(selection.to)}`;
  }
  const months = uniqueSorted(selection.months);
  if (months.length === 0) return "";
  const first = splitMonthKey(months[0]);
  const last = splitMonthKey(months[months.length - 1]);
  if (months.length === 1) return monthLabel(months[0]);

  if (isContiguous(months) && months.length > 2) {
    return first.year === last.year
      ? `${monthName(months[0])} – ${monthName(months[months.length - 1])} ${first.year}`
      : `${monthLabel(months[0])} – ${monthLabel(months[months.length - 1])}`;
  }
  // list, grouping month names under their year
  const byYear = new Map<number, string[]>();
  for (const key of months) {
    const { year } = splitMonthKey(key);
    byYear.set(year, [...(byYear.get(year) ?? []), monthName(key)]);
  }
  return [...byYear.entries()].map(([year, names]) => `${names.join(", ")} ${year}`).join("; ");
}

/** ASCII-safe label for file names, e.g. "February_March_2026" or "February_to_October_2026". */
export function selectionFileLabel(selection: ReportSelection): string {
  if (selection.mode === "dates" && selection.from && selection.to) {
    return selection.from === selection.to ? selection.from : `${selection.from}_to_${selection.to}`;
  }
  const months = uniqueSorted(selection.months);
  if (months.length === 0) return "No_Period";
  const first = splitMonthKey(months[0]);
  const last = splitMonthKey(months[months.length - 1]);
  const sameYear = first.year === last.year;

  if (months.length <= 4) {
    if (sameYear) return `${months.map(monthName).join("_")}_${first.year}`;
    return months.map((key) => `${monthName(key)}_${splitMonthKey(key).year}`).join("_");
  }
  if (isContiguous(months)) {
    return sameYear
      ? `${monthName(months[0])}_to_${monthName(months[months.length - 1])}_${first.year}`
      : `${monthName(months[0])}_${first.year}_to_${monthName(months[months.length - 1])}_${last.year}`;
  }
  return `${months.length}_Selected_Months_${first.year}${sameYear ? "" : `-${last.year}`}`;
}

/** Query string that reproduces a selection (used by the export links and the form). */
export function selectionToQuery(selection: ReportSelection): URLSearchParams {
  const query = new URLSearchParams({ mode: selection.mode });
  if (selection.mode === "months") query.set("months", uniqueSorted(selection.months).join(","));
  if (selection.mode === "range") {
    const months = uniqueSorted(selection.months);
    query.set("start", months[0] ?? "");
    query.set("end", months[months.length - 1] ?? "");
  }
  if (selection.mode === "dates") {
    query.set("from", selection.from ?? "");
    query.set("to", selection.to ?? "");
  }
  if (selection.types.length !== REPORT_TYPES.length) query.set("types", selection.types.join(","));
  return query;
}

/** Month options for the picker: earliest data month (or this month) through the latest of data/this month. */
export function buildMonthOptions(earliest: string | null, latest: string | null, current: string): string[] {
  const start = [earliest, current].filter((v): v is string => !!v).sort()[0];
  const end = [latest, current].filter((v): v is string => !!v).sort().reverse()[0];
  return monthsBetween(start, end).slice(-MAX_REPORT_MONTHS);
}
