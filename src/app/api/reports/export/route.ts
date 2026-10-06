import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/auth";
import { buildCsv } from "@/lib/reports/export/csv";
import { reportFileName } from "@/lib/reports/export/filename";
import { buildPdf } from "@/lib/reports/export/pdf";
import { buildXlsx } from "@/lib/reports/export/xlsx";
import { parseReportParams } from "@/lib/reports/period";
import { getReport, ReportTooLargeError } from "@/lib/reports/queries";
import { REPORT_EXPORT_FORMATS, type ReportExportFormat } from "@/lib/reports/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<ReportExportFormat, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv; charset=utf-8",
  pdf: "application/pdf",
};

const json = (error: string, status: number) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

/**
 * GET /api/reports/export?format=xlsx|csv|pdf&mode=months&months=2026-02,2026-03&types=sales,expenses
 * Generated from the database for the signed-in user only.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return json("You must be signed in.", 401);

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const format = REPORT_EXPORT_FORMATS.find((item) => item === params.format);
  if (!format) return json("Choose an export format: xlsx, csv or pdf.", 400);

  const parsed = parseReportParams(params);
  if (parsed.status === "idle") return json("Select the months or dates to export.", 400);
  if (parsed.status === "error") return json(parsed.error, 400);

  try {
    const report = await getReport(userId, parsed.selection);
    if (report.totals.transactionCount === 0) {
      return json("There are no transactions in the selected period, so there is nothing to export.", 422);
    }

    const body = format === "xlsx" ? await buildXlsx(report) : format === "pdf" ? buildPdf(report) : buildCsv(report);
    const fileName = reportFileName(report, format);

    return new Response(typeof body === "string" ? body : new Uint8Array(body), {
      headers: {
        "Content-Type": CONTENT_TYPES[format],
        "Content-Disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof ReportTooLargeError) return json(error.message, 413);
    console.error("Report export failed", error);
    return json("The report could not be generated. Please try again.", 500);
  }
}
