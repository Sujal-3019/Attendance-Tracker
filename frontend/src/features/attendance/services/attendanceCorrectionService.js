import { apiRequest } from "@/lib/api";

export async function getCorrectionRequests() {
  return apiRequest("/api/v1/attendance/corrections");
}

export async function clearResolvedCorrectionRequests() {
  return apiRequest("/api/v1/attendance/corrections/clear", {
    method: "POST",
  });
}

export async function getCorrectionRequestById(requestId) {
  return apiRequest(
    `/api/v1/attendance/corrections/${encodeURIComponent(requestId)}`,
  );
}

export async function approveCorrection(requestId, reviewReason) {
  return apiRequest(
    `/api/v1/attendance/corrections/${encodeURIComponent(requestId)}/approve`,
    { method: "POST", body: { reviewReason } },
  );
}

export async function rejectCorrection(requestId, reviewReason) {
  return apiRequest(
    `/api/v1/attendance/corrections/${encodeURIComponent(requestId)}/reject`,
    { method: "POST", body: { reviewReason } },
  );
}
