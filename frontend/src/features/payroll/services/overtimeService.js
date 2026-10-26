import { apiRequest } from "@/lib/api";

export function getOvertimeRequests() {
  return apiRequest("/api/v1/overtime/requests");
}

export function getOvertimeRequestById(requestId) {
  return apiRequest(
    `/api/v1/overtime/requests/${encodeURIComponent(requestId)}`,
  );
}

export function approveOvertime(requestId, overtimeHours, reviewNote) {
  return apiRequest(
    `/api/v1/overtime/requests/${encodeURIComponent(requestId)}/approve`,
    { method: "POST", body: { overtimeHours, reviewNote } },
  );
}

export function rejectOvertime(requestId, reviewNote) {
  return apiRequest(
    `/api/v1/overtime/requests/${encodeURIComponent(requestId)}/reject`,
    { method: "POST", body: { reviewNote } },
  );
}
