import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import AppShell from "@/app/layouts/AppShell";

import EmployeeForm from "../components/EmployeeForm";
import { getEmployeeById } from "../services/employeeService";

function EditEmployeePage() {
  const { employeeId } = useParams();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadEmployee() {
      const data = await getEmployeeById(employeeId);

      if (mounted) {
        setEmployee(data);
        setLoading(false);
      }
    }

    loadEmployee();

    return () => {
      mounted = false;
    };
  }, [employeeId]);

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          to={`/employees/${employeeId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to employee
        </Link>

        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Workforce
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Edit employee
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Update employee information and work configuration.
          </p>
        </div>

        {loading ? (
          <div className="h-96 animate-pulse rounded-2xl border border-border/60 bg-card/40" />
        ) : employee ? (
          <EmployeeForm employee={employee} />
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-16 text-center">
            <p className="text-sm font-semibold">Employee not found</p>

            <p className="mt-1 text-sm text-muted-foreground">
              The employee you're trying to edit does not exist.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default EditEmployeePage;