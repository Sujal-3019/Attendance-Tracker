import { apiRequest } from "@/lib/api";

export async function getLeaveRequests(params = {}) {
  const query = new URLSearchParams({ page: "1", page_size: "100", ...params });
  const result = await apiRequest(`/api/v1/leaves/requests?${query}`);
  return result.items;
}

export function getLeaveStats() {
  return apiRequest("/api/v1/leaves/summary");
}

export async function getLeaveBalances() {
  const rows = await apiRequest("/api/v1/leaves/balances");
  return rows.map((row) => ({
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    balances: row.balances.map((balance) => ({
      code: balance.code,
      type: balance.type,
      allocated: Number(balance.allowance),
      used: Number(balance.used),
      remaining: Number(balance.remaining),
    })),
  }));
}

export function getLeaveRequestById(requestId) {
  return apiRequest(`/api/v1/leaves/requests/${encodeURIComponent(requestId)}`);
}

export function approveLeave(requestId) {
  return apiRequest(
    `/api/v1/leaves/requests/${encodeURIComponent(requestId)}/approve`,
    { method: "POST" },
  );
}

export function rejectLeave(requestId, rejectionReason) {
  return apiRequest(
    `/api/v1/leaves/requests/${encodeURIComponent(requestId)}/reject`,
    { method: "POST", body: { rejectionReason } },
  );
}
