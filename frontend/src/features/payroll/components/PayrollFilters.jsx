import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const departments = [
  "All",
  "Engineering",
  "Design",
  "Operations",
  "Marketing",
  "HR",
  "Finance",
  "Sales",
];

const wageModels = [
  "All",
  "Monthly",
  "Daily",
  "Hourly",
];

const payrollStatuses = [
  "All",
  "Ready",
  "Needs Review",
];

function PayrollFilters({
  filters,
  onFilterChange,
  onClear,
}) {
  const hasActiveFilters =
    filters.search ||
    filters.department !== "All" ||
    filters.wageModel !== "All" ||
    filters.payrollStatus !== "All";

  return (
    <section className="rounded-2xl border bg-background/80 p-5 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
            </div>

            <div>
              <h2 className="text-sm font-semibold">
                Payroll filters
              </h2>

              <p className="hidden text-xs text-muted-foreground sm:block">
                Narrow down employee payroll records.
              </p>
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
            >
              <X className="size-4" />
              Clear
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 xl:col-span-1">
            <Label htmlFor="payroll-search">
              Search employee
            </Label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="payroll-search"
                value={filters.search}
                onChange={(event) =>
                  onFilterChange(
                    "search",
                    event.target.value,
                  )
                }
                placeholder="Name or employee ID"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payroll-department">
              Department
            </Label>

            <select
              id="payroll-department"
              value={filters.department}
              onChange={(event) =>
                onFilterChange(
                  "department",
                  event.target.value,
                )
              }
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department === "All"
                    ? "All departments"
                    : department}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payroll-wage-model">
              Wage model
            </Label>

            <select
              id="payroll-wage-model"
              value={filters.wageModel}
              onChange={(event) =>
                onFilterChange(
                  "wageModel",
                  event.target.value,
                )
              }
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {wageModels.map((model) => (
                <option key={model} value={model}>
                  {model === "All"
                    ? "All wage models"
                    : model}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payroll-status">
              Payroll status
            </Label>

            <select
              id="payroll-status"
              value={filters.payrollStatus}
              onChange={(event) =>
                onFilterChange(
                  "payrollStatus",
                  event.target.value,
                )
              }
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {payrollStatuses.map((status) => (
                <option key={status} value={status}>
                  {status === "All"
                    ? "All statuses"
                    : status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PayrollFilters;