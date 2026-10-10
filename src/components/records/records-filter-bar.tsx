"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { ClearFiltersButton } from "@/components/records/clear-filters-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useRecordFilters } from "@/hooks/use-record-filters";
import { todayInManila } from "@/lib/dates";
import { DATE_PRESETS, DATE_PRESET_LABELS, matchingPreset, presetRange, type DatePreset } from "@/lib/records/date-presets";
import { getSnapshot } from "@/lib/records/filter-store";
import { DEBT_STATUSES, DEBT_STATUS_LABELS } from "@/lib/debts/constants";
import { GCASH_PROVIDERS, GCASH_PROVIDER_LABELS, GCASH_TRANSACTION_TYPES, GCASH_TYPE_LABELS } from "@/lib/gcash/constants";
import { applyFilters, recordsHrefFor, restoreQuery, type FilterValues } from "@/lib/records/filter-state";
import type { RecordTab } from "@/lib/records/tabs";
import { SALARY_STATUSES, SALARY_STATUS_LABELS } from "@/lib/salary/constants";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/lib/sales/constants";

interface Option {
  value: string;
  label: string;
}

interface RecordsFilterBarProps {
  tab: RecordTab;
  /** What the URL currently filters by (already validated on the server). */
  values: FilterValues;
  categories: Option[];
}

const SEARCH_PLACEHOLDER: Record<RecordTab, string> = {
  sales: "Transaction no., customer, item, notes",
  gcash: "Notes, e.g. name or reference",
  expenses: "Description, notes or category",
  debts: "Name or description",
  excess: "Notes",
  reimbursement: "Description or notes",
  salary: "Employee or notes",
};

function selectsFor(tab: RecordTab, categories: Option[]): { key: string; label: string; allLabel: string; options: Option[] }[] {
  switch (tab) {
    case "sales":
      return [
        { key: "category", label: "Category", allLabel: "All", options: categories },
        { key: "payment", label: "Payment", allLabel: "All", options: PAYMENT_METHODS.map((m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] })) },
      ];
    case "gcash":
      return [
        { key: "type", label: "Type", allLabel: "All", options: GCASH_TRANSACTION_TYPES.map((t) => ({ value: t, label: GCASH_TYPE_LABELS[t] })) },
        { key: "provider", label: "Provider", allLabel: "All", options: GCASH_PROVIDERS.map((p) => ({ value: p, label: GCASH_PROVIDER_LABELS[p] })) },
      ];
    case "expenses":
      return [{ key: "category", label: "Category", allLabel: "All categories", options: categories }];
    case "excess":
    case "reimbursement":
      return [];
    case "salary":
      return [
        { key: "employee", label: "Employee", allLabel: "All", options: categories },
        { key: "status", label: "Status", allLabel: "All", options: SALARY_STATUSES.map((s) => ({ value: s, label: SALARY_STATUS_LABELS[s] })) },
      ];
    case "debts":
      return [{ key: "status", label: "Status", allLabel: "All", options: DEBT_STATUSES.map((s) => ({ value: s, label: DEBT_STATUS_LABELS[s] })) }];
  }
}

/**
 * One filter bar for all four tables. Search and the date range are shared by every tab; the
 * dropdowns belong to the open tab. Everything is remembered in localStorage.
 * The parent gives this component a `key`, so it starts fresh whenever the URL's filters change.
 */
export function RecordsFilterBar({ tab, values, categories }: RecordsFilterBarProps) {
  const router = useRouter();
  const { stored, apply, rememberUrl } = useRecordFilters();
  const [draft, setDraft] = useState<FilterValues>(values);

  // When the page opens: bring back remembered filters if the URL has none, else remember the URL's.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Read the store directly: on a hard load this component's first render saw the empty server snapshot.
    const next = restoreQuery(getSnapshot(), params);
    if (next) router.replace(`/records?${next}`, { scroll: false });
    else rememberUrl(tab, params);
    // Only on first render of this (keyed) instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (nextDraft: FilterValues) => {
    const next = applyFilters(stored, tab, nextDraft);
    apply(tab, nextDraft);
    router.push(recordsHrefFor(next, tab), { scroll: false });
  };

  const applyPreset = (preset: DatePreset) => {
    const nextDraft = { ...draft, ...presetRange(preset, todayInManila()) };
    setDraft(nextDraft);
    submit(nextDraft);
  };

  const activePreset = matchingPreset(values.from ?? "", values.to ?? "", todayInManila());

  const set = (key: string, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const selects = selectsFor(tab, categories);
  const active = Object.values(values).some(Boolean);

  return (
    <Card>
      <CardContent>
        <form
          aria-label="Filters"
          className="grid grid-cols-2 gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]"
          onSubmit={(event) => {
            event.preventDefault();
            submit(draft);
          }}
        >
          <div className="col-span-2 space-y-1 lg:col-span-1">
            <Label htmlFor="records-q">Search</Label>
            <Input id="records-q" value={draft.q ?? ""} onChange={(e) => set("q", e.target.value)} placeholder={SEARCH_PLACEHOLDER[tab]} maxLength={100} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="records-from">From</Label>
            <Input id="records-from" type="date" value={draft.from ?? ""} onChange={(e) => set("from", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="records-to">To</Label>
            <Input id="records-to" type="date" value={draft.to ?? ""} onChange={(e) => set("to", e.target.value)} />
          </div>
          {selects.map((select) => (
            <div key={select.key} className="space-y-1">
              <Label htmlFor={`records-${select.key}`}>{select.label}</Label>
              <Select id={`records-${select.key}`} value={draft[select.key] ?? ""} onChange={(e) => set(select.key, e.target.value)}>
                <option value="">{select.allLabel}</option>
                {select.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          ))}
          <div role="group" aria-label="Quick date filters" className="col-span-2 flex flex-wrap gap-2 lg:col-span-5">
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                size="sm"
                variant={activePreset === preset ? "default" : "outline"}
                aria-pressed={activePreset === preset}
                onClick={() => applyPreset(preset)}
              >
                {DATE_PRESET_LABELS[preset]}
              </Button>
            ))}
          </div>
          <div className="col-span-2 flex items-end justify-end gap-2 lg:col-span-5">
            {active ? <ClearFiltersButton tab={tab} variant="ghost">Clear</ClearFiltersButton> : null}
            <Button type="submit">
              <Search /> Apply filters
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
