import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import AppShell from "@/app/layouts/AppShell";
import { Button } from "@/components/ui/button";

import EmployeePayrollDetails from "../components/EmployeePayrollDetails";
import { getEmployeePayroll } from "../services/payrollService";

function EmployeePayrollDetailsPage() {
  const { employeeId } = useParams();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEmployeePayroll() {
      try {
        setLoading(true);
        setError("");

        const data = await getEmployeePayroll(employeeId);

        setEmployee(data);
      } catch (loadError) {
        setError(
          loadError.message ||
            "Unable to load employee payroll details.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadEmployeePayroll();
  }, [employeeId]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            render={<Link to="/payroll" />}
          >
            <ArrowLeft className="size-4" />
            Back to payroll
          </Button>
        </div>

        {loading && (
          <div className="space-y-6">
            <div className="h-32 animate-pulse rounded-2xl bg-muted" />

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-2xl bg-muted"
                />
              ))}
            </div>

            <div className="h-72 animate-pulse rounded-2xl bg-muted" />
          </div>
        )}

        {!loading && error && (
          <section
            role="alert"
            className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6"
          >
            <p className="font-medium text-destructive">
              Unable to load payroll details
            </p>

            <p className="mt-1 text-sm text-destructive/80">
              {error}
            </p>
          </section>
        )}

        {!loading && !error && employee && (
          <EmployeePayrollDetails employee={employee} />
        )}
      </div>
    </AppShell>
  );
}

export default EmployeePayrollDetailsPage;