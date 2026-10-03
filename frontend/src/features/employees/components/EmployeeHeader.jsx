import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

function EmployeeHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Workforce
        </p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Employees
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Manage employees, work assignments, employment status, and attendance
          information.
        </p>
      </div>

      <Button className="w-full rounded-xl sm:w-auto">
        <Plus className="size-4" />
        Add employee
      </Button>
    </div>
  );
}

export default EmployeeHeader;