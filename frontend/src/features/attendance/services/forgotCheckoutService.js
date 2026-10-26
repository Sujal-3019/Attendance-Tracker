import { apiRequest } from "@/lib/api";

export async function getForgotCheckoutRecords() {
  return apiRequest("/api/v1/attendance/forgot-checkout");
}

export async function getForgotCheckoutRecordById(recordId) {
  return apiRequest(
    `/api/v1/attendance/forgot-checkout/${encodeURIComponent(recordId)}`,
  );
}

export async function resolveForgotCheckout(recordId, decision, adminNote) {
  return apiRequest(
    `/api/v1/attendance/forgot-checkout/${encodeURIComponent(recordId)}/resolve`,
    { method: "POST", body: { decision, adminNote } },
  );
}
