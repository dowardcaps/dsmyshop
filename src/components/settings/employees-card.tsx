import { Pencil, Plus } from "lucide-react";

import { EmployeeDialog } from "@/components/settings/employee-dialog";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteEmployeeAction } from "@/lib/actions/settings";
import { formatPeso } from "@/lib/format";
import type { EmployeeRow } from "@/lib/settings/service";

export function EmployeesCard({ employees }: { employees: EmployeeRow[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle>Employees</CardTitle>
          <CardDescription>Used by the Salary tab. Pay dates are the 15th and 30th of each month.</CardDescription>
        </div>
        <EmployeeDialog>
          <Button size="sm">
            <Plus /> Add employee
          </Button>
        </EmployeeDialog>
      </CardHeader>
      <CardContent>
        <ul className="divide-y rounded-md border" data-testid="employee-list">
          {employees.map((employee) => {
            const inUse = employee.paidPeriods > 0 || employee.advances > 0;
            return (
              <li key={employee.id} className="flex items-center justify-between gap-3 px-4 py-3" data-testid="employee-row">
                <div className="min-w-0">
                  <p className="truncate font-medium">{employee.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPeso(employee.monthlySalaryCents / 100)} / month · since {employee.startMonth}
                  </p>
                </div>
                <div className="flex shrink-0 items-center">
                  <EmployeeDialog employee={employee}>
                    <Button variant="ghost" size="icon" aria-label={`Edit ${employee.name}`}>
                      <Pencil className="size-4" />
                    </Button>
                  </EmployeeDialog>
                  <ConfirmDeleteButton
                    iconOnly
                    ariaLabel={`Delete ${employee.name}`}
                    action={deleteEmployeeAction.bind(null, employee.id)}
                    title={`Delete ${employee.name}?`}
                    description="Their unpaid pay dates are removed too."
                    successMessage="Employee deleted."
                    disabled={inUse || employees.length <= 1}
                    disabledReason={employees.length <= 1 ? "Keep at least one employee" : "Has paid salaries or advances"}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
