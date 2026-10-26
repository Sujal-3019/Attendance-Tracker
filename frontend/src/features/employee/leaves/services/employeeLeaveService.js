import { apiRequest } from "@/lib/api";

export function getMyLeaves() {
  return apiRequest("/api/v1/me/leaves");
}

export function applyForLeave(payload) {
  return apiRequest("/api/v1/me/leaves", { method: "POST", body: payload });
}
