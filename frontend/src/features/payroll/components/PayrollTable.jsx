import { ArrowUpRight, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getPayrollStatus(employee) {
  if (
    employee.unpaidLeaveDays > 0 ||
    employee.totalDeductions > employee.baseEarnings * 0.1
  ) {
    return {
      label: "Needs Review",
      className:
        "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    };
  }

  return {
    label: "Ready",
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  };
}

function PayrollTable({ employees = [], loading = false }) {
  if (loading) {
    return (
      <section className="overflow-hidden rounded-2xl border bg-background/80 shadow-sm">
        <div className="border-b p-6">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
        </div>

        <div className="space-y-4 p-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!employees.length) {
    return (
      <section className="rounded-2xl border bg-background/80 p-10 text-center shadow-sm">
        <p className="font-medium">No payroll records found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try changing your filters or payroll period.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-background/80 shadow-sm">
      <div className="border-b p-6">
        <h2 className="font-semibold">Employee payroll</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Review earnings, overtime, deductions, and net payable for
          each employee.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-275 text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-left">
              <th className="px-6 py-3 font-medium text-muted-foreground">
                Employee
              </th>

              <th className="px-4 py-3 font-medium text-muted-foreground">
                Wage
              </th>

              <th className="px-4 py-3 font-medium text-muted-foreground">
                Worked
              </th>

              <th className="px-4 py-3 font-medium text-muted-foreground">
                Leave
              </th>

              <th className="px-4 py-3 font-medium text-muted-foreground">
                Overtime
              </th>

              <th className="px-4 py-3 font-medium text-muted-foreground">
                Deductions
              </th>

              <th className="px-4 py-3 font-medium text-muted-foreground">
                Net pay
              </th>

              <th className="px-4 py-3 font-medium text-muted-foreground">
                Status
              </th>

              <th className="px-4 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y">
            {employees.map((employee) => {
              const status = getPayrollStatus(employee);

              return (
                <tr
                  key={employee.employeeId}
                  className="transition-colors hover:bg-muted/20"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">
                        {employee.name}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {employee.employeeCode} ·{" "}
                        {employee.department}
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium">
                        {formatCurrency(employee.baseWage)}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {employee.wageModel}
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-medium">
                      {employee.daysWorked}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      of {employee.workingDays} days
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <div className="space-y-0.5 text-xs">
                      <p>
                        Paid:{" "}
                        <span className="font-medium">
                          {employee.paidLeaveDays}
                        </span>
                      </p>

                      <p>
                        Unpaid:{" "}
                        <span className="font-medium">
                          {employee.unpaidLeaveDays}
                        </span>
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-medium">
                      {employee.overtimeHours}h
                    </p>

                    <p className="text-xs text-muted-foreground">
                      +{formatCurrency(employee.overtimePay)}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-medium text-destructive">
                      -{formatCurrency(employee.totalDeductions)}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Late + leave
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-semibold">
                      {formatCurrency(employee.netPay)}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Actions for ${employee.name}`}
                          />
                        }
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          render={
                            <Link
                              to={`/payroll/${employee.employeeId}`}
                            />
                          }
                        >
                          <ArrowUpRight className="size-4" />
                          View salary details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default PayrollTable;