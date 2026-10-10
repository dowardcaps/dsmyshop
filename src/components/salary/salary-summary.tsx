import { Card, CardContent } from "@/components/ui/card";
import { formatPeso } from "@/lib/format";
import type { SalaryPeriodsResult } from "@/lib/salary/queries";

/** Remaining balance per employee (unpaid pay dates only) plus the overall total. */
export function SalarySummary({ result, filtered }: { result: SalaryPeriodsResult; filtered: boolean }) {
  const money = (cents: number) => formatPeso(cents / 100);
  const suffix = filtered ? " (filtered)" : "";

  return (
    <section aria-label={filtered ? "Salary summary, filtered" : "Salary summary"} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {result.employees.map((employee) => (
        <Card key={employee.employeeId} className="gap-1 py-4" data-testid={`salary-owed-${employee.name}`}>
          <CardContent>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{employee.name} · remaining balance{suffix}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums" data-testid={`salary-owed-${employee.name}-value`}>
              {money(employee.owedCents)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {money(employee.advancesCents)} advances · {money(employee.paidOutCents)} paid out
            </p>
          </CardContent>
        </Card>
      ))}
      <Card className="gap-1 py-4" data-testid="salary-owed-total">
        <CardContent>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total remaining balance{suffix}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums" data-testid="salary-owed-total-value">
            {money(result.totals.owedCents)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {money(result.totals.advancesCents)} advances · {money(result.totals.paidOutCents)} paid out
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
