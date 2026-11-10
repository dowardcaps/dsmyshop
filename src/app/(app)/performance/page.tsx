import { PageHeader } from "@/components/layout/page-header";
import { BreakEvenCalculator } from "@/components/performance/break-even-calculator";
import { MonthPicker } from "@/components/performance/month-picker";
import { SimpleOverview } from "@/components/performance/simple-overview";
import { PerformanceSettingsPanel } from "@/components/performance/settings-panel";
import { PerformanceTabs } from "@/components/performance/tabs";
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance"
        description={`Are we hitting the sales target? · ${monthLabel(month)}`}
        actions={
          <MonthPicker month={month} tab={tab} currentMonth={currentMonth} />
        }
      />
      <PerformanceTabs active={tab} month={month} />

      {tab === "overview" ? <SimpleOverview data={data} /> : null}

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
