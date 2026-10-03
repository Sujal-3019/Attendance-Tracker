import { useEffect, useMemo, useState } from "react";

import AppShell from "@/app/layouts/AppShell";

import EmployeeFilters from "../components/EmployeeFilters";
import EmployeeHeader from "../components/EmployeeHeader";
import EmployeeStats from "../components/EmployeeStats";
import EmployeeTable from "../components/EmployeeTable";
import {
  getEmployeeStats,
  getEmployees,
} from "../services/employeeService";

function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [workMode, setWorkMode] = useState("all");

  useEffect(() => {
    let mounted = true;

    async function loadEmployees() {
      const [employeesData, statsData] = await Promise.all([
        getEmployees(),
        getEmployeeStats(),
      ]);

      if (mounted) {
        setEmployees(employeesData);
        setStats(statsData);
      }
    }

    loadEmployees();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch =
        !normalizedSearch ||
        employee.name.toLowerCase().includes(normalizedSearch) ||
        employee.email.toLowerCase().includes(normalizedSearch) ||
        employee.department.toLowerCase().includes(normalizedSearch) ||
        employee.designation.toLowerCase().includes(normalizedSearch);

      const matchesDepartment =
        department === "all" || employee.department === department;

      const matchesStatus =
        status === "all" || employee.status === status;

      const matchesWorkMode =
        workMode === "all" || employee.workMode === workMode;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesStatus &&
        matchesWorkMode
      );
    });
  }, [employees, search, department, status, workMode]);

  return (
    <AppShell>
      <div className="space-y-8">
        <EmployeeHeader />

        <EmployeeStats stats={stats} />

        <EmployeeFilters
          search={search}
          setSearch={setSearch}
          department={department}
          setDepartment={setDepartment}
          status={status}
          setStatus={setStatus}
          workMode={workMode}
          setWorkMode={setWorkMode}
        />

        <EmployeeTable employees={filteredEmployees} />
      </div>
    </AppShell>
  );
}

export default EmployeesPage;