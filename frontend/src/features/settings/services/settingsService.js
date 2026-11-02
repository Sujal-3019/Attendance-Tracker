import { apiRequest } from "@/lib/api";

export function getOrganizationSettings() {
  return apiRequest("/api/v1/settings/organization");
}

export function updateOrganizationSettings(settings) {
  return apiRequest("/api/v1/settings/organization", {
    method: "PATCH",
    body: settings,
  });
}

export function generateCompanyCode() {
  return apiRequest("/api/v1/settings/company-code", {
    method: "POST",
  });
}

export function getAttendancePolicy() {
  return apiRequest("/api/v1/settings/attendance-policy");
}

export function updateAttendancePolicy(policy) {
  return apiRequest("/api/v1/settings/attendance-policy", {
    method: "PUT",
    body: policy,
  });
}

export function getWorkLocations() {
  return apiRequest("/api/v1/settings/work-locations");
}

export function createWorkLocation(locationData) {
  return apiRequest("/api/v1/settings/work-locations", {
    method: "POST",
    body: locationData,
  });
}

export function updateWorkLocation(locationId, locationData) {
  return apiRequest(
    `/api/v1/settings/work-locations/${encodeURIComponent(locationId)}`,
    { method: "PATCH", body: locationData },
  );
}

export function updateWorkLocationStatus(locationId, status) {
  return apiRequest(
    `/api/v1/settings/work-locations/${encodeURIComponent(locationId)}/status`,
    { method: "PATCH", body: { status } },
  );
}

export function getPayrollSettings() {
  return apiRequest("/api/v1/settings/payroll-policy");
}

export function updatePayrollSettings(settings) {
  return apiRequest("/api/v1/settings/payroll-policy", {
    method: "PUT",
    body: settings,
  });
}
