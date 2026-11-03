import { Pencil } from "lucide-react";

import { EmployeeDialog } from "@/components/settings/employee-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPeso } from "@/lib/format";
import type { EditableEmployee } from "@/hooks/use-employee-form";
import type { SalaryPeriodsResult } from "@/lib/salary/queries";

/** Remaining balance per employee (unpaid pay dates only) plus the overall total. */
export function SalarySummary({
  result,
  filtered,
  editable = [],
}: {
  result: SalaryPeriodsResult;
  filtered: boolean;
  editable?: EditableEmployee[];
}) {
  const money = (cents: number) => formatPeso(cents / 100);
  const suffix = filtered ? " (filtered)" : "";

  return (
    <section
      aria-label={filtered ? "Salary summary, filtered" : "Salary summary"}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {result.employees.map((employee) => {
        const editing = editable.find((e) => e.id === employee.employeeId);
        return (
          <Card
            key={employee.employeeId}
            className="gap-1 py-4"
            data-testid={`salary-owed-${employee.name}`}
          >
            <CardContent>
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {employee.name} · remaining balance{suffix}
                </p>
                {editing ? (
                  <EmployeeDialog employee={editing}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="-my-2 -mr-2 size-8"
                      aria-label={`Edit salary of ${employee.name}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </EmployeeDialog>
                ) : null}
              </div>
              {editing ? (
                <p className="text-xs text-muted-foreground">
                  {money(editing.monthlySalaryCents)} a month ·{" "}
                  {money(editing.monthlySalaryCents / 2)} per cut-off
                </p>
              ) : null}
              <p
                className="mt-1 text-2xl font-semibold tabular-nums"
                data-testid={`salary-owed-${employee.name}-value`}
              >
                {money(employee.owedCents)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {money(employee.advancesCents)} advances ·{" "}
                {money(employee.paidOutCents)} paid out
              </p>
            </CardContent>
          </Card>
        );
      })}
      <Card className="gap-1 py-4" data-testid="salary-owed-total">
        <CardContent>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Total remaining balance{suffix}
          </p>
          <p
            className="mt-1 text-2xl font-semibold tabular-nums"
            data-testid="salary-owed-total-value"
          >
            {money(result.totals.owedCents)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {money(result.totals.advancesCents)} advances ·{" "}
            {money(result.totals.paidOutCents)} paid out
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
