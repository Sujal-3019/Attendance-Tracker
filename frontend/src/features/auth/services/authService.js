import { apiRequest, setAccessToken } from "@/lib/api";

export function getAdminRegistrationStatus() {
  return apiRequest("/api/v1/auth/admin-registration/status");
}

export function getCurrentUser() {
  return apiRequest("/api/v1/auth/me");
}

export async function registerAdmin(payload) {
  const result = await apiRequest("/api/v1/auth/register/admin", {
    method: "POST",
    body: payload,
  });
  setAccessToken(result.accessToken);
  return result;
}

export async function loginUser(payload) {
  const result = await apiRequest("/api/v1/auth/login", {
    method: "POST",
    body: payload,
  });
  setAccessToken(result.accessToken);
  return result;
}

export async function registerEmployee(payload) {
  return apiRequest("/api/v1/auth/register/employee", {
    method: "POST",
    body: payload,
  });
}
