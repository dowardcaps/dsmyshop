"use client";

import { FileBarChart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useReportSelector } from "@/hooks/use-report-selector";
import { monthLabel, monthName } from "@/lib/reports/period";
import {
  REPORT_MODE_LABELS,
  REPORT_MODES,
  REPORT_TYPE_LABELS,
  REPORT_TYPES,
  type ReportSelection,
} from "@/lib/reports/types";
import { cn } from "@/lib/utils";

interface ReportSelectorProps {
  monthOptions: string[];
  initial: ReportSelection | null;
  error: string | null;
}

/** A GET form: the chosen report lives in the URL, so it can be bookmarked and the exports reuse it. */
export function ReportSelector({ monthOptions, initial, error }: ReportSelectorProps) {
  const s = useReportSelector({ monthOptions, initial });

  return (
    <Card>
      <CardContent>
        <form method="get" action="/reports" className="space-y-6" aria-label="Report options">
          {Object.entries(s.fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}

          {error ? (
            <p role="alert" data-testid="report-error" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">1. Reporting period</legend>
            <div role="group" aria-label="Period type" className="inline-flex rounded-md border p-0.5">
              {REPORT_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={s.mode === mode}
                  onClick={() => s.setMode(mode)}
                  className={cn(
                    "cursor-pointer rounded px-3 py-1.5 text-sm font-medium transition-colors",
                    s.mode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {REPORT_MODE_LABELS[mode]}
                </button>
              ))}
            </div>

            {s.mode === "months" ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={s.selectAllMonths}>
                    Select all
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={s.clearMonths}>
                    Clear selection
                  </Button>
                  <span className="text-sm text-muted-foreground" data-testid="months-count">
                    {s.months.length} month{s.months.length === 1 ? "" : "s"} selected
                  </span>
                </div>
                {s.years.map(({ year, keys }) => (
                  <div key={year} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-medium">{year}</h3>
                      <button type="button" onClick={() => s.toggleYear(keys)} className="cursor-pointer text-xs text-primary hover:underline">
                        {keys.every((key) => s.selectedMonths.has(key)) ? "Unselect year" : "Select year"}
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                      {keys.map((key) => (
                        <label
                          key={key}
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                            s.selectedMonths.has(key) ? "border-primary bg-accent" : "hover:bg-muted",
                          )}
                        >
                          <input
                            type="checkbox"
                            className="size-4 accent-[var(--primary)]"
                            checked={s.selectedMonths.has(key)}
                            onChange={() => s.toggleMonth(key)}
                            aria-label={monthLabel(key)}
                          />
                          {monthName(key)}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {s.mode === "range" ? (
              <div className="space-y-2">
                <div className="grid gap-3 sm:max-w-md sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="range-start">Start month</Label>
                    <Select id="range-start" value={s.start} onChange={(e) => s.setStart(e.target.value)}>
                      {monthOptions.map((key) => (
                        <option key={key} value={key}>
                          {monthLabel(key)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="range-end">End month</Label>
                    <Select id="range-end" value={s.end} onChange={(e) => s.setEnd(e.target.value)}>
                      {monthOptions.map((key) => (
                        <option key={key} value={key}>
                          {monthLabel(key)}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {s.rangeMonthCount > 0 ? `${s.rangeMonthCount} month${s.rangeMonthCount === 1 ? "" : "s"}, start and end included.` : "The start month must not be after the end month."}
                </p>
              </div>
            ) : null}

            {s.mode === "dates" ? (
              <div className="grid gap-3 sm:max-w-md sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="date-from">From</Label>
                  <Input id="date-from" type="date" value={s.from} onChange={(e) => s.setFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="date-to">To</Label>
                  <Input id="date-to" type="date" value={s.to} onChange={(e) => s.setTo(e.target.value)} />
                </div>
              </div>
            ) : null}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">2. What to include</legend>
            <div className="flex flex-wrap gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium">
                <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={s.allTypes} onChange={s.toggleAllTypes} />
                All transactions
              </label>
              {REPORT_TYPES.map((type) => (
                <label key={type} className={cn("flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm", s.types.includes(type) && "border-primary bg-accent")}>
                  <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={s.types.includes(type)} onChange={() => s.toggleType(type)} />
                  {REPORT_TYPE_LABELS[type]}
                </label>
              ))}
            </div>
          </fieldset>

          <Button type="submit">
            <FileBarChart /> Generate report
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
