import { apiRequest } from "@/lib/api";

export function getLeavePolicies() {
  return apiRequest("/api/v1/leave-types");
}

export function getLeavePolicyById(policyId) {
  return apiRequest(`/api/v1/leave-types/${encodeURIComponent(policyId)}`);
}

export function createLeavePolicy(policyData) {
  return apiRequest("/api/v1/leave-types", {
    method: "POST",
    body: policyData,
  });
}

export function updateLeavePolicy(policyId, policyData) {
  return apiRequest(`/api/v1/leave-types/${encodeURIComponent(policyId)}`, {
    method: "PATCH",
    body: policyData,
  });
}

export function updateLeavePolicyStatus(policyId, status) {
  return apiRequest(
    `/api/v1/leave-types/${encodeURIComponent(policyId)}/status`,
    { method: "PATCH", body: { status } },
  );
}
