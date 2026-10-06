import { Download, FileSpreadsheet, FileText, Table2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPeso } from "@/lib/format";
import { NET_INCOME_EXPLANATION } from "@/lib/reports/calc";
import { selectionToQuery } from "@/lib/reports/period";
import { REPORT_TYPE_LABELS, REPORT_TYPES, type Report } from "@/lib/reports/types";
import { cn } from "@/lib/utils";

const peso = (cents: number) => formatPeso(cents / 100);

export function ReportPreview({ report }: { report: Report }) {
  const { totals, included, counts } = report;
  const empty = totals.transactionCount === 0;
  const query = selectionToQuery(report.selection);
  const exportHref = (format: string) => `/api/reports/export?${new URLSearchParams({ format, ...Object.fromEntries(query) }).toString()}`;

  const stat = (id: string, label: string, value: string, hint: string, tone?: "positive" | "negative") => (
    <Card key={id} className="gap-1 py-4" data-testid={id}>
      <CardContent>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-xl font-semibold tabular-nums", tone === "positive" && "text-primary", tone === "negative" && "text-destructive")} data-testid={`${id}-value`}>
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
  const val = (on: boolean, cents: number) => (on ? peso(cents) : "Not included");
  const net = totals.netIncomeCents;

  return (
    <section aria-label="Report" className="space-y-6" data-testid="report">
      <div>
        <h2 className="text-lg font-semibold">Report for {report.periodLabel}</h2>
        <p className="text-sm text-muted-foreground">
          Includes {REPORT_TYPES.filter((t) => included[t]).map((t) => REPORT_TYPE_LABELS[t]).join(", ")}. Records are matched by transaction date.
        </p>
      </div>

      {empty ? (
        <Card>
          <CardContent className="py-10 text-center" data-testid="report-empty">
            <p className="font-medium">No transactions found for this period</p>
            <p className="mt-1 text-sm text-muted-foreground">Try other months or dates, or include more transaction types. Nothing to export yet.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Export</CardTitle>
              <CardDescription>Generated from your records for exactly this period and these transaction types.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild>
                <a href={exportHref("xlsx")} download data-testid="export-xlsx">
                  <FileSpreadsheet /> Excel (.xlsx)
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={exportHref("pdf")} download data-testid="export-pdf">
                  <FileText /> PDF
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={exportHref("csv")} download data-testid="export-csv">
                  <Table2 /> CSV
                </a>
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stat("r-sales", "Total sales", val(included.sales, totals.salesCents), `${counts.sales} sale${counts.sales === 1 ? "" : "s"}`)}
            {stat("r-expenses", "Total expenses", val(included.expenses, totals.expensesCents), `${counts.expenses} expense${counts.expenses === 1 ? "" : "s"}`)}
            {stat("r-charges", "GCash charges", val(included.gcash, totals.gcashChargesCents), `${counts.gcash} transaction${counts.gcash === 1 ? "" : "s"}. Amounts moved are not income`)}
            {stat(
              "r-net",
              "Net income",
              net === null ? "Not calculated" : peso(net),
              net === null ? "Needs sales, GCash and expenses included" : "Sales + GCash charges − expenses",
              net === null ? undefined : net < 0 ? "negative" : net > 0 ? "positive" : undefined,
            )}
            {stat("r-debt", "Debt payments", val(included.debts, totals.debtPaymentsCents), "Shown separately, not an expense")}
            {stat("r-adjust", "Adjustments", val(included.adjustments, totals.adjustmentsCents), "Shown separately, not in net income")}
            {stat("r-count", "Transactions", totals.transactionCount.toLocaleString("en-PH"), "Records in this report")}
            {stat("r-moved", "GCash money moved", included.gcash ? peso(totals.gcashCashInCents + totals.gcashCashOutCents + totals.gcashLoadCents) : "Not included", "Cash in + out + load. Not revenue")}
          </div>

          {report.monthly.length > 1 ? (
            <Card data-testid="monthly-table">
              <CardHeader>
                <CardTitle>Monthly summary</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">GCash charges</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Net income</TableHead>
                      <TableHead className="text-right">Debt payments</TableHead>
                      <TableHead className="text-right">Adjustments</TableHead>
                      <TableHead className="text-right">Txns</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.monthly.map((m) => (
                      <TableRow key={m.key}>
                        <TableCell className="whitespace-nowrap font-medium">{m.label}</TableCell>
                        <TableCell className="text-right tabular-nums">{val(included.sales, m.salesCents)}</TableCell>
                        <TableCell className="text-right tabular-nums">{val(included.gcash, m.gcashChargesCents)}</TableCell>
                        <TableCell className="text-right tabular-nums">{val(included.expenses, m.expensesCents)}</TableCell>
                        <TableCell className="text-right tabular-nums">{m.netIncomeCents === null ? "n/a" : peso(m.netIncomeCents)}</TableCell>
                        <TableCell className="text-right tabular-nums">{val(included.debts, m.debtPaymentsCents)}</TableCell>
                        <TableCell className="text-right tabular-nums">{val(included.adjustments, m.adjustmentsCents)}</TableCell>
                        <TableCell className="text-right tabular-nums">{m.transactionCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell>Combined total</TableCell>
                      <TableCell className="text-right tabular-nums">{val(included.sales, totals.salesCents)}</TableCell>
                      <TableCell className="text-right tabular-nums">{val(included.gcash, totals.gcashChargesCents)}</TableCell>
                      <TableCell className="text-right tabular-nums">{val(included.expenses, totals.expensesCents)}</TableCell>
                      <TableCell className="text-right tabular-nums">{net === null ? "n/a" : peso(net)}</TableCell>
                      <TableCell className="text-right tabular-nums">{val(included.debts, totals.debtPaymentsCents)}</TableCell>
                      <TableCell className="text-right tabular-nums">{val(included.adjustments, totals.adjustmentsCents)}</TableCell>
                      <TableCell className="text-right tabular-nums">{totals.transactionCount}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="size-4" /> How these numbers are calculated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {NET_INCOME_EXPLANATION.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}
