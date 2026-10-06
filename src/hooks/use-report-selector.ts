"use client";

import { useMemo, useState } from "react";

import { monthsBetween, splitMonthKey } from "@/lib/reports/period";
import { REPORT_TYPES, type ReportMode, type ReportSelection, type ReportType } from "@/lib/reports/types";

interface Options {
  /** Months offered in the picker, oldest first. */
  monthOptions: string[];
  /** The selection already in the URL, if any. */
  initial: ReportSelection | null;
}

/** State and actions for the report selector form. All selection rules live here, not in the component. */
export function useReportSelector({ monthOptions, initial }: Options) {
  const firstOption = monthOptions[0] ?? "";
  const lastOption = monthOptions[monthOptions.length - 1] ?? "";

  const [mode, setMode] = useState<ReportMode>(initial?.mode ?? "months");
  const [months, setMonths] = useState<string[]>(initial && initial.mode === "months" ? initial.months : []);
  const [start, setStart] = useState(initial?.mode === "range" ? (initial.months[0] ?? firstOption) : firstOption);
  const [end, setEnd] = useState(initial?.mode === "range" ? (initial.months[initial.months.length - 1] ?? lastOption) : lastOption);
  const [from, setFrom] = useState(initial?.from ?? "");
  const [to, setTo] = useState(initial?.to ?? "");
  const [types, setTypes] = useState<ReportType[]>(initial?.types ?? [...REPORT_TYPES]);

  const selectedMonths = useMemo(() => new Set(months), [months]);
  const years = useMemo(() => {
    const byYear = new Map<number, string[]>();
    for (const key of monthOptions) {
      const { year } = splitMonthKey(key);
      byYear.set(year, [...(byYear.get(year) ?? []), key]);
    }
    return [...byYear.entries()].map(([year, keys]) => ({ year, keys }));
  }, [monthOptions]);

  const toggleMonth = (key: string) =>
    setMonths((current) => (current.includes(key) ? current.filter((m) => m !== key) : [...current, key].sort()));
  const selectAllMonths = () => setMonths([...monthOptions]);
  const clearMonths = () => setMonths([]);
  const toggleYear = (keys: string[]) =>
    setMonths((current) => {
      const all = keys.every((key) => current.includes(key));
      return all ? current.filter((m) => !keys.includes(m)) : [...new Set([...current, ...keys])].sort();
    });

  const toggleType = (type: ReportType) =>
    setTypes((current) => (current.includes(type) ? current.filter((t) => t !== type) : REPORT_TYPES.filter((t) => t === type || current.includes(t))));
  const allTypes = types.length === REPORT_TYPES.length;
  const toggleAllTypes = () => setTypes(allTypes ? [] : [...REPORT_TYPES]);

  const rangeMonthCount = start && end ? monthsBetween(start, end).length : 0;

  /** Values for the hidden form fields of the active mode. */
  const fields: Record<string, string> = { mode };
  if (mode === "months") fields.months = months.join(",");
  if (mode === "range") {
    fields.start = start;
    fields.end = end;
  }
  if (mode === "dates") {
    fields.from = from;
    fields.to = to;
  }
  if (!allTypes) fields.types = types.join(",");

  return {
    mode, setMode,
    months, selectedMonths, years, toggleMonth, selectAllMonths, clearMonths, toggleYear,
    start, setStart, end, setEnd, rangeMonthCount,
    from, setFrom, to, setTo,
    types, allTypes, toggleType, toggleAllTypes,
    fields,
  };
}
