import { apiRequest } from "@/lib/api";

export class EmployeeServiceError extends Error {
  constructor(message, code = "EMPLOYEE_REQUEST_FAILED") {
    super(message);
    this.name = "EmployeeServiceError";
    this.code = code;
  }
}

export async function getEmployees(params = {}) {
  const query = new URLSearchParams({ page: "1", page_size: "100", ...params });
  const result = await apiRequest(`/api/v1/employees?${query}`);
  return result.items;
}

export async function getEmployeeById(employeeId) {
  return apiRequest(`/api/v1/employees/${encodeURIComponent(employeeId)}`);
}

export function getEmployeeStats() {
  return apiRequest("/api/v1/employees/summary");
}

export function getEmployeeDetails(employeeId) {
  return getEmployeeById(employeeId);
}

export function createEmployee(employeeData) {
  const { employeeId, id, ...fields } = employeeData;
  return apiRequest("/api/v1/employees", {
    method: "POST",
    body: {
      ...fields,
      employeeCode: employeeId || id,
      name: fields.name || fields.fullName,
    },
  });
}

export function updateEmployee(employeeId, employeeData) {
  const {
    id: _id,
    name: _name,
    employeeId: employeeCode,
    attendance: _attendance,
    ...fields
  } = employeeData;
  return apiRequest(`/api/v1/employees/${encodeURIComponent(employeeId)}`, {
    method: "PATCH",
    body: { ...fields, employeeCode },
  });
}

export function updateEmployeeStatus(employeeId, status) {
  return apiRequest(
    `/api/v1/employees/${encodeURIComponent(employeeId)}/status`,
    { method: "PATCH", body: { status } },
  );
}
