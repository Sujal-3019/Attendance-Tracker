import {
  Banknote,
  CalendarDays,
  Clock3,
  Minus,
  Plus,
  WalletCards,
} from "lucide-react";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function DetailRow({ label, value, description }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>

        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function EmployeePayrollDetails({ employee }) {
  if (!employee) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Employee overview */}
      <section className="rounded-2xl border bg-background/80 p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Employee
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              {employee.name}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {employee.employeeCode} · {employee.department}
            </p>
          </div>

          <div className="rounded-xl bg-muted/60 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Wage model
            </p>

            <p className="mt-1 text-sm font-semibold">
              {employee.wageModel}
            </p>
          </div>
        </div>
      </section>

      {/* Salary summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <section className="rounded-2xl border bg-background/80 p-5 shadow-sm">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
            <Banknote className="size-4 text-muted-foreground" />
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Base earnings
          </p>

          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(employee.baseEarnings)}
          </p>
        </section>

        <section className="rounded-2xl border bg-background/80 p-5 shadow-sm">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
            <Plus className="size-4 text-muted-foreground" />
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Overtime
          </p>

          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(employee.overtimePay)}
          </p>
        </section>

        <section className="rounded-2xl border bg-background/80 p-5 shadow-sm">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
            <Minus className="size-4 text-muted-foreground" />
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Deductions
          </p>

          <p className="mt-1 text-xl font-semibold text-destructive">
            {formatCurrency(employee.totalDeductions)}
          </p>
        </section>

        <section className="rounded-2xl border bg-background/80 p-5 shadow-sm">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <WalletCards className="size-4 text-primary" />
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Net payable
          </p>

          <p className="mt-1 text-xl font-semibold">
            {formatCurrency(employee.netPay)}
          </p>
        </section>
      </div>

      {/* Attendance & leave */}
      <section className="rounded-2xl border bg-background/80 shadow-sm">
        <div className="border-b p-6">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />

            <h3 className="font-semibold">
              Attendance & leave
            </h3>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Attendance and leave information used for this payroll
            calculation.
          </p>
        </div>

        <div className="divide-y px-6">
          <DetailRow
            label="Working days"
            value={employee.workingDays}
            description="Scheduled working days"
          />

          <DetailRow
            label="Days worked"
            value={employee.daysWorked}
            description="Recorded attendance"
          />

          <DetailRow
            label="Paid leave"
            value={`${employee.paidLeaveDays} days`}
            description="Does not reduce base earnings"
          />

          <DetailRow
            label="Unpaid leave"
            value={`${employee.unpaidLeaveDays} days`}
            description="Can reduce payable salary"
          />

          <DetailRow
            label="Late minutes"
            value={`${employee.lateMinutes} min`}
            description="Late arrival recorded during the period"
          />
        </div>
      </section>

      {/* Overtime */}
      <section className="rounded-2xl border bg-background/80 shadow-sm">
        <div className="border-b p-6">
          <div className="flex items-center gap-2">
            <Clock3 className="size-4 text-muted-foreground" />

            <h3 className="font-semibold">
              Overtime
            </h3>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Additional working hours and overtime earnings.
          </p>
        </div>

        <div className="divide-y px-6">
          <DetailRow
            label="Overtime hours"
            value={`${employee.overtimeHours} hours`}
          />

          <DetailRow
            label="Overtime earnings"
            value={formatCurrency(employee.overtimePay)}
          />
        </div>
      </section>

      {/* Earnings & deductions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-background/80 shadow-sm">
          <div className="border-b p-6">
            <h3 className="font-semibold">
              Earnings
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Amounts added to the employee's payable salary.
            </p>
          </div>

          <div className="divide-y px-6">
            <DetailRow
              label="Base earnings"
              value={formatCurrency(employee.baseEarnings)}
            />

            <DetailRow
              label="Overtime"
              value={`+ ${formatCurrency(employee.overtimePay)}`}
            />

            <div className="flex items-center justify-between py-4">
              <p className="font-semibold">
                Gross earnings
              </p>

              <p className="font-semibold">
                {formatCurrency(employee.grossEarnings)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-background/80 shadow-sm">
          <div className="border-b p-6">
            <h3 className="font-semibold">
              Deductions
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Amounts deducted from gross earnings.
            </p>
          </div>

          <div className="divide-y px-6">
            <DetailRow
              label="Late deduction"
              value={`- ${formatCurrency(employee.lateDeduction)}`}
              description={`${employee.lateMinutes} late minutes`}
            />

            <DetailRow
              label="Absence deduction"
              value={`- ${formatCurrency(employee.absenceDeduction)}`}
            />

            <DetailRow
              label="Unpaid leave deduction"
              value={`- ${formatCurrency(
                employee.unpaidLeaveDeduction,
              )}`}
              description={`${employee.unpaidLeaveDays} unpaid leave days`}
            />

            <div className="flex items-center justify-between py-4">
              <p className="font-semibold">
                Total deductions
              </p>

              <p className="font-semibold text-destructive">
                - {formatCurrency(employee.totalDeductions)}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Final payable */}
      <section className="rounded-2xl border bg-background/80 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Final payable salary
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {formatCurrency(employee.netPay)}
            </p>
          </div>

          <div className="rounded-xl bg-muted/60 px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Gross
            </span>

            <span className="mx-2">−</span>

            <span className="font-medium">
              Deductions
            </span>

            <span className="mx-2">=</span>

            <span className="font-semibold">
              Net pay
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default EmployeePayrollDetails;