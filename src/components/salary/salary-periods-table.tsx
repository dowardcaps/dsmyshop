import { PeriodStatusButton } from "@/components/salary/period-status-button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatPeso } from "@/lib/format";
import type { SalaryPeriodRow } from "@/lib/salary/queries";

export function SalaryPeriodsTable({ rows }: { rows: SalaryPeriodRow[] }) {
  const money = (cents: number) => formatPeso(cents / 100);

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Pay date</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead className="text-right">Salary</TableHead>
            <TableHead className="text-right">Advances</TableHead>
            <TableHead className="text-right">Remaining balance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const label = `${row.employeeName}, ${formatDate(row.payDate)}`;
            return (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap">{formatDate(row.payDate)}</TableCell>
                <TableCell className="font-medium">{row.employeeName}</TableCell>
                <TableCell className="text-right tabular-nums">{money(row.grossCents)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{row.advancesCents > 0 ? `− ${money(row.advancesCents)}` : "-"}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{money(row.remainingCents)}</TableCell>
                <TableCell>
                  {row.paidOn ? <Badge variant="success">Paid {formatDate(row.paidOn)}</Badge> : <Badge variant="warning">Unpaid</Badge>}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <PeriodStatusButton periodId={row.id} paid={row.paidOn !== null} label={label} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
