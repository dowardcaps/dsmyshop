import { csvField } from "@/lib/reports/export/csv";
import { monthLabel } from "@/lib/performance/months";
import type { PerformanceData } from "@/lib/performance/queries";

const money = (cents: number) => Number((cents / 100).toFixed(2));

/** Monthly profit and loss, the assumptions behind it, and one line per day. UTF-8 with BOM and CRLF so Excel opens it. */
export function performanceCsv(data: PerformanceData): string {
  const t = data.monthTotals;
  const lines: (string | number)[][] = [
    ["DS Finance - Business Performance", monthLabel(data.month)],
    [],
    ["Monthly profit and loss", "Amount (PHP)", "% of sales"],
    ...[
      ["Gross sales", t.salesCents],
      ["Material costs", -t.materialCents],
      ["Gross profit", t.profit.grossProfitCents],
      ...data.fixedLines.map(
        (l) => [`Fixed: ${l.name}`, -l.cents] as [string, number],
      ),
      ["Other expenses", -t.otherCents],
      ["Net profit", t.profit.netProfitCents],
    ].map(([label, cents]) => [
      label,
      money(cents as number),
      t.salesCents > 0
        ? (((cents as number) / t.salesCents) * 100).toFixed(1) + "%"
        : "",
    ]),
    [],
    ["Assumptions"],
    ["Monthly fixed costs", money(data.monthlyFixedCents)],
    ["Operating days per month", data.settings.operatingDays],
    ["Daily fixed cost", money(data.dailyFixedCents)],
    [
      "Daily break-even (fixed only)",
      money(data.breakEven.dailyFixedBreakEvenCents),
    ],
    [
      "Daily break-even (with variable costs)",
      data.breakEven.dailyBreakEvenCents === null
        ? "n/a"
        : money(data.breakEven.dailyBreakEvenCents),
    ],
    ["Variable cost %", data.variableCostPct.toFixed(1)],
    ["Daily target", money(data.settings.dailyTargetCents)],
    ["Growth target", money(data.settings.growthTargetCents)],
    [],
    [
      "Date",
      "Gross sales",
      "Material costs",
      "Gross profit",
      "Fixed cost allocation",
      "Other expenses",
      "Net profit",
      "Margin %",
    ],
    ...data.days.map((d) => [
      d.date,
      money(d.salesCents),
      money(d.materialCents),
      money(d.profit.grossProfitCents),
      money(d.profit.fixedCostCents),
      money(d.otherCents),
      money(d.profit.netProfitCents),
      d.profit.marginPct === null ? "" : d.profit.marginPct.toFixed(1),
    ]),
    [],
    [
      "Basis: fixed costs are allocated only to days with sales; the monthly figure counts them once. Material costs = expenses in categories marked Material.",
    ],
  ];
  return "﻿" + lines.map((row) => row.map(csvField).join(",")).join("\r\n");
}
