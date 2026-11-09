import { requireUser } from "@/lib/auth/require-user";
import { performanceCsv } from "@/lib/performance/csv";
import { getPerformance } from "@/lib/performance/queries";
import { isMonthKey } from "@/lib/performance/months";
import { todayInManila } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireUser();
  const requested = new URL(request.url).searchParams.get("month") ?? "";
  const month = isMonthKey(requested) ? requested : todayInManila().slice(0, 7);
  const csv = performanceCsv(await getPerformance(user.id, month));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ds-performance-${month}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
