import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

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

      const data = await getEmployeeDetails(employeeId);

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

      <div className="h-28 animate-pulse rounded-2xl border border-border/60 bg-card/40" />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="h-72 animate-pulse rounded-2xl border border-border/60 bg-card/40" />
        <div className="h-72 animate-pulse rounded-2xl border border-border/60 bg-card/40" />
      </div>

      <div className="h-72 animate-pulse rounded-2xl border border-border/60 bg-card/40" />

      <div className="h-48 animate-pulse rounded-2xl border border-border/60 bg-card/40" />
    </div>
  );
}

function EmployeeNotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Employee not found</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          The employee you are looking for does not exist.
        </p>
      </div>
    </div>
  );
}

export default EmployeeDetailsPage;