import { apiRequest } from "@/lib/api";

export function getMyPayroll() {
  return apiRequest("/api/v1/me/payroll");
}

export function getMyPayslip(payslipId) {
  return apiRequest(`/api/v1/me/payroll/${encodeURIComponent(payslipId)}`);
}

export function getMySalaryProjection() {
  return apiRequest("/api/v1/me/payroll/projection");
}
