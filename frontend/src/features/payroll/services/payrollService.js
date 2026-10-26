import { apiRequest } from "@/lib/api";

function periodParams(month, year) {
  const params = new URLSearchParams();
  if (month !== undefined) params.set("month", String(month));
  if (year !== undefined) params.set("year", String(year));
  return params.toString();
}

export async function finalizePayroll(employeeId, month, year) {
  const query = periodParams(month, year);
  return apiRequest(
    `/api/v1/payroll/employees/${encodeURIComponent(employeeId)}/finalize${query ? `?${query}` : ""}`,
    { method: "POST" },
  );
}

export async function getPayrollEmployees(month, year) {
  const query = periodParams(month, year);
  const result = await apiRequest(
    `/api/v1/payroll/employees${query ? `?${query}` : ""}`,
  );
  return result.items;
}

export async function getEmployeePayroll(employeeId, month, year) {
  const query = periodParams(month, year);
  return apiRequest(
    `/api/v1/payroll/employees/${encodeURIComponent(employeeId)}${query ? `?${query}` : ""}`,
  );
}

export async function getPayrollSummary(month, year) {
  const query = periodParams(month, year);
  return apiRequest(`/api/v1/payroll/summary${query ? `?${query}` : ""}`);
}
