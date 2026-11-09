import { PageHeader } from "@/components/layout/page-header";
import { BreakEvenCalculator } from "@/components/performance/break-even-calculator";
import { PerformanceCharts } from "@/components/performance/charts";
import { MonthPicker } from "@/components/performance/month-picker";
import {
  BreakdownLists,
  DailyTable,
  MonthlyProfitLoss,
} from "@/components/performance/profit-tables";
import { SimpleOverview } from "@/components/performance/simple-overview";
import { PerformanceSettingsPanel } from "@/components/performance/settings-panel";
import { PerformanceSummary } from "@/components/performance/summary-cards";
import { PerformanceTabs } from "@/components/performance/tabs";
import { TargetMonitor } from "@/components/performance/target-monitor";
import { requireUser } from "@/lib/auth/require-user";
import { todayInManila } from "@/lib/dates";
import {
  PERFORMANCE_TABS,
  type PerformanceTab,
} from "@/lib/performance/constants";
import { isMonthKey, monthLabel } from "@/lib/performance/months";
import { getPerformance, listCategoryKinds } from "@/lib/performance/queries";
import {
  firstParam,
  type RawSearchParams,
} from "@/lib/validation/filter-utils";

export const metadata = { title: "Performance | DS Finance" };

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const currentMonth = todayInManila().slice(0, 7);
  const rawMonth = firstParam(params.month) ?? "";
  const month = isMonthKey(rawMonth) ? rawMonth : currentMonth;
  const rawTab = firstParam(params.tab);
  const tab: PerformanceTab =
    PERFORMANCE_TABS.find((t) => t.id === rawTab)?.id ?? "overview";

  const [data, categories] = await Promise.all([
    getPerformance(user.id, month),
    tab === "settings" ? listCategoryKinds(user.id) : Promise.resolve([]),
  ]);
  const pesos = (cents: number) => cents / 100;
  const noRecords =
    data.monthTotals.salesCents === 0 &&
    data.monthTotals.materialCents + data.monthTotals.otherCents === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance"
        description={`How much DS Prints earns, spends and keeps · ${monthLabel(month)}`}
        actions={
          <MonthPicker
            month={month}
            tab={tab}
            currentMonth={currentMonth}
            showExport={tab === "details" || tab === "daily"}
          />
        }
      />
      <PerformanceTabs active={tab} month={month} />

      {tab === "overview" ? <SimpleOverview data={data} /> : null}

      {tab === "details" ? (
        <div className="space-y-6">
          {noRecords ? (
            <p
              className="rounded-md border border-dashed p-4 text-sm text-muted-foreground"
              data-testid="perf-empty"
            >
              No sales or expenses recorded for {monthLabel(month)} yet. Fixed
              costs of{" "}
              {new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: "PHP",
              }).format(pesos(data.monthlyFixedCents))}{" "}
              still apply, so the month starts in the red until sales come in.
            </p>
          ) : null}
          <PerformanceSummary data={data} />
          <TargetMonitor data={data} />
          <PerformanceCharts
            days={data.days.map((d) => ({
              label: d.date.slice(8),
              sales: pesos(d.salesCents),
            }))}
            trend={data.trend.map((t) => ({
              month: t.month,
              sales: pesos(t.salesCents),
              expenses: pesos(t.materialCents + t.otherCents + t.fixedCents),
              net: pesos(t.profit.netProfitCents),
            }))}
            breakdown={data.expenseBreakdown.map((e) => ({
              name: e.name,
              value: pesos(e.cents),
            }))}
            dailyTarget={pesos(data.settings.dailyTargetCents)}
            breakEven={
              data.breakEven.dailyBreakEvenCents === null
                ? null
                : pesos(data.breakEven.dailyBreakEvenCents)
            }
          />
          <div className="grid gap-4 xl:grid-cols-[2fr_3fr]">
            <MonthlyProfitLoss data={data} />
            <BreakdownLists data={data} />
          </div>
        </div>
      ) : null}

      {tab === "daily" ? <DailyTable data={data} /> : null}

      {tab === "breakeven" ? (
        <BreakEvenCalculator
          key={`${month}-${data.settings.operatingDays}-${data.monthlyFixedCents}-${data.variableCostPct}-${data.settings.dailyTargetCents}`}
          defaults={{
            monthlyFixed: pesos(data.monthlyFixedCents),
            operatingDays: data.settings.operatingDays,
            averageDailySales:
              data.operatingDaysDone > 0
                ? pesos(data.monthTotals.salesCents) / data.operatingDaysDone
                : pesos(data.settings.dailyTargetCents),
            variableCostPct: data.variableCostPct,
            dailyTarget: pesos(data.settings.dailyTargetCents),
            variableSource:
              data.variableCostPctSource === "setting"
                ? "Saved in settings."
                : data.variableCostPctSource === "actual"
                  ? "Real share this month."
                  : "No sales yet, so 0%.",
          }}
        />
      ) : null}

      {tab === "settings" ? (
        <PerformanceSettingsPanel
          settings={data.settings}
          fixedLines={data.fixedLines}
          categories={categories}
          month={month}
        />
      ) : null}
    </div>
  );
}
