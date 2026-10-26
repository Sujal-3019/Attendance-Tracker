import { apiRequest } from "@/lib/api";

export function getDashboardStats() {
  return apiRequest("/api/v1/dashboard/summary");
}

export function getRecentAttendance() {
  return apiRequest("/api/v1/dashboard/recent-attendance");
}

export async function getAttendanceChart() {
  const result = await apiRequest("/api/v1/dashboard/attendance-chart");
  return result.items;
}
