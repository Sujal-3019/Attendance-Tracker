import { apiRequest } from "@/lib/api";

export function getMyProfile() {
  return apiRequest("/api/v1/me/profile");
}

export function updateMyProfile(updates) {
  return apiRequest("/api/v1/me/profile", { method: "PATCH", body: updates });
}
