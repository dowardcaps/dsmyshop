import Link from "next/link";
import { LayoutDashboard, Plus } from "lucide-react";

import { BreakdownCard } from "@/components/dashboard/breakdown-card";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/require-user";
import { getDashboardData } from "@/lib/dashboard/queries";
import { parseDashboardPeriod, periodLabel, yearOptions } from "@/lib/dashboard/period";
import type { RawSearchParams } from "@/lib/validation/filter-utils";

export const metadata = { title: "Dashboard | DS Finance" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await requireUser();
  const period = parseDashboardPeriod(await searchParams);
  const data = await getDashboardData(user.id, period);
  const label = periodLabel(period);

  if (data.isEmpty) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Financial overview for the selected month." />
        <EmptyState
          icon={LayoutDashboard}
          title="No records yet"
          description="Your dashboard fills in as soon as you record a sale, an expense, a GCash transaction or a debt."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href="/sales/new">
                  <Plus /> Add a sale
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/expenses/new">Add an expense</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/gcash/new">Add GCash</Link>
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Financial overview for ${label}.`}
        actions={<PeriodFilter period={period} years={yearOptions(data.earliestYear, period.year)} />}
      />
      <SummaryCards data={data} />
      <BreakdownCard data={data} />
      <DashboardCharts monthly={data.monthly} salesByCategory={data.salesByCategory} year={period.year} periodText={label} />
      <RecentTransactions rows={data.recent} periodText={label} />
    </div>
  );
}
