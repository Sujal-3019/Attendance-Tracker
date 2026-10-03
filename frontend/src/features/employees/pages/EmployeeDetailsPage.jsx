import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import AppShell from "@/app/layouts/AppShell";

import EmployeeDetails from "../components/EmployeeDetails";
import { getEmployeeDetails } from "../services/employeeService";

function EmployeeDetailsPage() {
  const { employeeId } = useParams();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadEmployee() {
      setLoading(true);

      try {
        const employeeData = await getEmployeeDetails(employeeId);

        if (mounted) {
          setEmployee(employeeData);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadEmployee();

    return () => {
      mounted = false;
    };
  }, [employeeId]);

  return (
    <AppShell>
      {loading ? (
        <EmployeeDetailsSkeleton />
      ) : employee ? (
        <EmployeeDetails employee={employee} />
      ) : (
        <EmployeeNotFound />
      )}
    </AppShell>
  );
}

function EmployeeDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-32 animate-pulse rounded bg-muted" />

      <section className="rounded-2xl border border-border/60 bg-card/55 p-6">
        <div className="flex items-center gap-4">
          <div className="size-16 animate-pulse rounded-2xl bg-muted" />

          <div className="space-y-2">
            <div className="h-6 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="h-72 animate-pulse rounded-2xl border border-border/60 bg-card/55" />
        <div className="h-72 animate-pulse rounded-2xl border border-border/60 bg-card/55" />
      </div>

      <div className="h-72 animate-pulse rounded-2xl border border-border/60 bg-card/55" />
      <div className="h-48 animate-pulse rounded-2xl border border-border/60 bg-card/55" />
    </div>
  );
}

function EmployeeNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-lg font-semibold">Employee not found</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          The employee you are looking for does not exist.
        </p>

        <Link
          to="/employees"
          className="mt-5 inline-flex rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Back to employees
        </Link>
      </div>
    </div>
  );
}

export default EmployeeDetailsPage;