"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  addFixedExpenseAction,
  changeFixedExpenseAction,
  endFixedExpenseAction,
  setCategoryKindAction,
} from "@/lib/actions/performance";
import { formatPeso } from "@/lib/format";
import {
  EXPENSE_KIND_LABELS,
  EXPENSE_KINDS,
  type ExpenseKindValue,
} from "@/lib/performance/constants";
import { monthLabel } from "@/lib/performance/months";
import type { FixedLine } from "@/lib/performance/queries";
import { usePerformanceSettingsForm } from "@/hooks/use-performance-settings-form";
import type { PerformanceSettings } from "@/lib/performance/service";

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

function SettingsForm({ settings }: { settings: PerformanceSettings }) {
  const { form, submit } = usePerformanceSettingsForm(settings);
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;
  const num = { valueAsNumber: true } as const;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Targets and assumptions</CardTitle>
        <CardDescription>
          Used for the dashboard cards, target monitor and break-even. Past
          transactions are never changed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={submit}
          noValidate
          className="grid gap-4 sm:grid-cols-2"
          data-testid="perf-settings-form"
        >
          <div className="space-y-1.5">
            <Label htmlFor="ps-days">Operating days per month</Label>
            <Input
              id="ps-days"
              type="number"
              inputMode="numeric"
              step="1"
              aria-invalid={!!errors.operatingDays}
              {...register("operatingDays", num)}
            />
            <FieldError message={errors.operatingDays?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ps-pct">Variable cost % (optional)</Label>
            <Input
              id="ps-pct"
              type="number"
              inputMode="decimal"
              step="0.01"
              aria-invalid={!!errors.variableCostPct}
              {...register("variableCostPct", {
                setValueAs: (v) => (v === "" || v === null ? null : Number(v)),
              })}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the real share of materials and other costs
              from your records.
            </p>
            <FieldError message={errors.variableCostPct?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ps-min">Minimum daily target (₱)</Label>
            <Input
              id="ps-min"
              type="number"
              inputMode="decimal"
              step="0.01"
              aria-invalid={!!errors.minDailyTarget}
              {...register("minDailyTarget", num)}
            />
            <FieldError message={errors.minDailyTarget?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ps-daily">Daily sales target (₱)</Label>
            <Input
              id="ps-daily"
              type="number"
              inputMode="decimal"
              step="0.01"
              aria-invalid={!!errors.dailyTarget}
              {...register("dailyTarget", num)}
            />
            <FieldError message={errors.dailyTarget?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ps-growth">Growth sales target (₱)</Label>
            <Input
              id="ps-growth"
              type="number"
              inputMode="decimal"
              step="0.01"
              aria-invalid={!!errors.growthTarget}
              {...register("growthTarget", num)}
            />
            <FieldError message={errors.growthTarget?.message} />
          </div>
          <div className="flex items-end justify-end sm:col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null} Save
              settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FixedCosts({ lines, month }: { lines: FixedLine[]; month: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [effective, setEffective] = useState(month);
  const total = lines.reduce((s, l) => s + l.cents, 0);

  function open(line?: FixedLine) {
    setEditing(line?.id ?? "new");
    setName(line?.name ?? "");
    setAmount(line ? String(line.cents / 100) : "");
    setEffective(month);
  }

  function save() {
    const input = { name, amount: Number(amount), effectiveMonth: effective };
    if (
      editing !== "new" &&
      !window.confirm(
        `Apply the new amount from ${monthLabel(effective)} onward? Earlier months keep their current amount.`,
      )
    )
      return;
    start(async () => {
      const result =
        editing === "new"
          ? await addFixedExpenseAction(input)
          : await changeFixedExpenseAction(editing!, input);
      if (!result.ok) return void toast.error(result.error);
      toast.success(
        editing === "new" ? "Fixed cost added." : "Fixed cost updated.",
      );
      setEditing(null);
      router.refresh();
    });
  }

  function remove(line: FixedLine) {
    if (
      !line.id ||
      !window.confirm(
        `Stop counting "${line.name}" from ${monthLabel(month)} onward? Earlier months keep it.`,
      )
    )
      return;
    start(async () => {
      const result = await endFixedExpenseAction(line.id!, month);
      if (!result.ok) return void toast.error(result.error);
      toast.success("Fixed cost removed.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Monthly fixed costs</CardTitle>
          <CardDescription>
            For {monthLabel(month)}: {formatPeso(total / 100)}. Salaries come
            from the Salary tab, so they are not typed here twice.
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => open()} disabled={pending}>
          <Plus /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="divide-y rounded-md border" data-testid="fixed-list">
          {lines.map((line) => (
            <li
              key={line.id ?? line.name}
              className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{line.name}</p>
                <p className="tabular-nums text-muted-foreground">
                  {formatPeso(line.cents / 100)} / month
                  {line.source === "salary"
                    ? " · from Settings > Employees"
                    : ""}
                </p>
              </div>
              {line.id ? (
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${line.name}`}
                    onClick={() => open(line)}
                    disabled={pending}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${line.name}`}
                    onClick={() => remove(line)}
                    disabled={pending}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
        {editing ? (
          <div
            className="grid gap-3 rounded-md border bg-muted/30 p-3 sm:grid-cols-3"
            data-testid="fixed-form"
          >
            <div className="space-y-1.5">
              <Label htmlFor="fx-name">Name</Label>
              <Input
                id="fx-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fx-amount">Amount per month (₱)</Label>
              <Input
                id="fx-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fx-from">Applies from</Label>
              <Input
                id="fx-from"
                type="month"
                value={effective}
                onChange={(e) => setEffective(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 sm:col-span-3">
              <Button
                variant="ghost"
                onClick={() => setEditing(null)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button onClick={save} disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : null} Save
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CategoryKinds({
  categories,
}: {
  categories: { id: string; name: string; kind: ExpenseKindValue }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  function change(id: string, kind: string) {
    start(async () => {
      const result = await setCategoryKindAction(id, kind);
      if (!result.ok) return void toast.error(result.error);
      toast.success("Category updated.");
      router.refresh();
    });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>How expense categories count</CardTitle>
        <CardDescription>
          Material cost = consumables used up for customers (paper, ink, film).
          Other expense = daily costs. Fixed cost = rent, internet and the like,
          already included above, so they are not subtracted twice.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No expense categories yet. Add some in Expenses.
          </p>
        ) : (
          <ul className="divide-y rounded-md border" data-testid="kind-list">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <span className="font-medium">{c.name}</span>
                <Select
                  aria-label={`Cost type of ${c.name}`}
                  value={c.kind}
                  disabled={pending}
                  onChange={(e) => change(c.id, e.target.value)}
                  className="w-full sm:w-72"
                >
                  {EXPENSE_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {EXPENSE_KIND_LABELS[k]}
                    </option>
                  ))}
                </Select>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function PerformanceSettingsPanel({
  settings,
  fixedLines,
  categories,
  month,
}: {
  settings: PerformanceSettings;
  fixedLines: FixedLine[];
  categories: { id: string; name: string; kind: ExpenseKindValue }[];
  month: string;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <SettingsForm settings={settings} />
      <FixedCosts lines={fixedLines} month={month} />
      <div className="xl:col-span-2">
        <CategoryKinds categories={categories} />
      </div>
    </div>
  );
}
