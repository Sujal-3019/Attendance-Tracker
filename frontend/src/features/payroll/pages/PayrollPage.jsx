import { useEffect, useMemo, useState } from "react";

import AppShell from "@/app/layouts/AppShell";

import PayrollFilters from "../components/PayrollFilters";
import PayrollHeader from "../components/PayrollHeader";
import PayrollSummary from "../components/PayrollSummary";
import PayrollTable from "../components/PayrollTable";

import {
  getPayrollEmployees,
  getPayrollSummary,
} from "../services/payrollService";

function PayrollPage() {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    department: "All",
    wageModel: "All",
    payrollStatus: "All",
  });

  useEffect(() => {
    async function loadPayroll() {
      try {
        setLoading(true);
        setError("");

        const [employeesData, summaryData] = await Promise.all([
          getPayrollEmployees(),
          getPayrollSummary(),
        ]);

        setEmployees(employeesData);
        setSummary(summaryData);
      } catch (loadError) {
        setError(
          loadError.message || "Unable to load payroll data.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadPayroll();
  }, [month, year]);

  function handleFilterChange(key, value) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }));
  }

  function handleClearFilters() {
    setFilters({
      search: "",
      department: "All",
      wageModel: "All",
      payrollStatus: "All",
    });
  }

  const filteredEmployees = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch =
        !search ||
        employee.name.toLowerCase().includes(search) ||
        employee.employeeId.toLowerCase().includes(search) ||
        employee.employeeCode.toLowerCase().includes(search);

      const matchesDepartment =
        filters.department === "All" ||
        employee.department === filters.department;

      const matchesWageModel =
        filters.wageModel === "All" ||
        employee.wageModel === filters.wageModel;

      let payrollStatus = "Ready";

      if (
        employee.unpaidLeaveDays > 0 ||
        employee.totalDeductions >
          employee.baseEarnings * 0.1
      ) {
        payrollStatus = "Needs Review";
      }

      const matchesStatus =
        filters.payrollStatus === "All" ||
        payrollStatus === filters.payrollStatus;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesWageModel &&
        matchesStatus
      );
    });
  }, [employees, filters]);

  function handleRunPayroll() {
    window.alert(
      `Payroll run for ${month}/${year} will be handled by the backend.`,
    );
  }

  function handleExport() {
    window.alert(
      `Payroll export for ${month}/${year} will be handled by the backend.`,
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PayrollHeader
          month={month}
          year={year}
          onMonthChange={setMonth}
          onYearChange={setYear}
          onRunPayroll={handleRunPayroll}
          onExport={handleExport}
        />

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <PayrollSummary
          summary={summary}
          loading={loading}
        />

        <PayrollFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
        />

        <PayrollTable
          employees={filteredEmployees}
          loading={loading}
        />
      </div>
    </AppShell>
  );
}

export default PayrollPage;