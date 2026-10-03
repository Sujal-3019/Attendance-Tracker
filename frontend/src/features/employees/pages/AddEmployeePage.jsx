import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import AppShell from "@/app/layouts/AppShell";

import EmployeeForm from "../components/EmployeeForm";

function AddEmployeePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          to="/employees"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to employees
        </Link>

        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Workforce
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Add employee
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Create an employee profile and configure their work assignment.
          </p>
        </div>

        <EmployeeForm />
      </div>
    </AppShell>
  );
}

export default AddEmployeePage;