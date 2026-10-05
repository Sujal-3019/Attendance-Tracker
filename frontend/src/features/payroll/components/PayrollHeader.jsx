import { Download, Play, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";

function PayrollHeader({
  month,
  year,
  onMonthChange,
  onYearChange,
  onRunPayroll,
  onExport,
}) {
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const currentYear = new Date().getFullYear();

  const years = Array.from(
    { length: 5 },
    (_, index) => currentYear - 2 + index,
  );

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <WalletCards className="size-4 text-primary" />
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Administration
            </p>

            <h1 className="text-2xl font-semibold tracking-tight">
              Payroll
            </h1>
          </div>
        </div>

        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Review employee earnings, attendance deductions, leave impact,
          overtime, and net payable salary.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(event) =>
              onMonthChange(Number(event.target.value))
            }
            aria-label="Payroll month"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {months.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(event) =>
              onYearChange(Number(event.target.value))
            }
            aria-label="Payroll year"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onExport}
          >
            <Download className="size-4" />
            Export
          </Button>

          <Button onClick={onRunPayroll}>
            <Play className="size-4" />
            Run payroll
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PayrollHeader;