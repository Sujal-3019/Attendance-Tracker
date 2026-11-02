import { apiRequest } from "@/lib/api";

export function getMyAttendance() {
  return apiRequest("/api/v1/me/attendance");
}

export function checkIn() {
  return apiRequest("/api/v1/me/attendance/check-in", { method: "POST" });
}

export function checkOut() {
  return apiRequest("/api/v1/me/attendance/check-out", { method: "POST" });
}

async function requestReset(event, reason) {
  await apiRequest("/api/v1/me/attendance/corrections", {
    method: "POST",
    body: { event, reason },
  });
  return getMyAttendance();
}

export function resetCheckIn() {
  return requestReset("check_in", "Employee requested check-in correction.");
}

export function resetCheckOut() {
  return requestReset("check_out", "Employee requested check-out correction.");
}
