import { PageHeader } from "@/components/layout/page-header";
import { ReportPreview } from "@/components/reports/report-preview";
import { ReportSelector } from "@/components/reports/report-selector";
import { requireUser } from "@/lib/auth/require-user";
import { currentPeriod } from "@/lib/dashboard/period";
import { buildMonthOptions, monthKey, parseReportParams } from "@/lib/reports/period";
import { getReport, getReportMonthBounds, ReportTooLargeError } from "@/lib/reports/queries";
import type { RawSearchParams } from "@/lib/validation/filter-utils";

export const metadata = { title: "Reports | DS Finance" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await requireUser();
  const parsed = parseReportParams(await searchParams);
  const { earliest, latest } = await getReportMonthBounds(user.id);
  const now = currentPeriod();
  const monthOptions = buildMonthOptions(earliest, latest, monthKey(now.year, now.month));

  let report = null;
  let error: string | null = parsed.status === "error" ? parsed.error : null;
  if (parsed.status === "ready") {
    try {
      report = await getReport(user.id, parsed.selection);
    } catch (caught) {
      if (caught instanceof ReportTooLargeError) error = caught.message;
      else throw caught;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Choose months or dates, then view the report and export it to Excel, PDF or CSV." />
      <ReportSelector
        monthOptions={monthOptions}
        initial={parsed.status === "idle" ? null : parsed.selection}
        error={error}
      />
      {report ? <ReportPreview report={report} /> : null}
    </div>
  );
}
