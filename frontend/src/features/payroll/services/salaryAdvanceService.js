import { apiRequest } from "@/lib/api";

export function getSalaryAdvances() {
  return apiRequest("/api/v1/advances");
}

export function getEmployeeSalaryAdvances() {
  return apiRequest("/api/v1/me/advances");
}

export function createSalaryAdvance(payload) {
  return apiRequest("/api/v1/advances", { method: "POST", body: payload });
}

export function recordAdvanceRepayment(advanceId, payload) {
  return apiRequest(
    `/api/v1/advances/${encodeURIComponent(advanceId)}/repayments`,
    {
      method: "POST",
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: payload,
    },
  );
}

export function settleSalaryAdvance(advanceId) {
  return apiRequest(
    `/api/v1/advances/${encodeURIComponent(advanceId)}/settle`,
    { method: "POST" },
  );
}

export function updateAdvanceRepaymentRule(advanceId, payload) {
  return apiRequest(
    `/api/v1/advances/${encodeURIComponent(advanceId)}/repayment-rule`,
    { method: "PATCH", body: payload },
  );
}

export function settlePayrollAdvanceDeductions() {
  throw new Error("Payroll-linked advance deductions require confirmed payroll rules.");
}
