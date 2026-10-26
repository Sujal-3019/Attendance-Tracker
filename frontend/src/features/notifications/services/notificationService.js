import { apiRequest } from "@/lib/api";

export async function getNotifications() {
  const result = await apiRequest("/api/v1/notifications");
  return result.items;
}

export async function getUnreadNotificationCount() {
  const result = await apiRequest("/api/v1/notifications/unread-count");
  return result.count;
}

export function markNotificationAsRead(notificationId) {
  return apiRequest(
    `/api/v1/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: "PATCH" },
  );
}

export function markAllNotificationsAsRead() {
  return apiRequest("/api/v1/notifications/read-all", { method: "PATCH" });
}
