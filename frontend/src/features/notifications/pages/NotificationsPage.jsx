import { CheckCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AppShell from "@/app/layouts/AppShell";
import { Button } from "@/components/ui/button";

import NotificationList from "../components/NotificationList";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadNotifications() {
      try {
        setLoading(true);
        setError("");

        const data = await getNotifications();

        setNotifications(data);
      } catch (loadError) {
        setError(
          loadError.message ||
            "Unable to load notifications.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  const unreadCount = notifications.filter(
    (notification) => notification.status === "Unread",
  ).length;

  const filteredNotifications = useMemo(() => {
    if (filter === "Unread") {
      return notifications.filter(
        (notification) =>
          notification.status === "Unread",
      );
    }

    if (filter === "Action Required") {
      return notifications.filter(
        (notification) => notification.actionRequired,
      );
    }

    if (filter === "High Priority") {
      return notifications.filter(
        (notification) =>
          notification.priority === "High",
      );
    }

    return notifications;
  }, [notifications, filter]);

  async function handleMarkAsRead(notification) {
    try {
      const updatedNotification =
        await markNotificationAsRead(notification.id);

      setNotifications((currentNotifications) =>
        currentNotifications.map((item) =>
          item.id === updatedNotification.id
            ? updatedNotification
            : item,
        ),
      );
    } catch (updateError) {
      setError(
        updateError.message ||
          "Unable to update notification.",
      );
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllNotificationsAsRead();

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          status: "Read",
        })),
      );
    } catch (updateError) {
      setError(
        updateError.message ||
          "Unable to update notifications.",
      );
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Administration
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Notifications
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Review attendance alerts, leave updates, payroll
              notifications, and other important events.
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="size-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border bg-background/80 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Total
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {notifications.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-background/80 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Unread
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {unreadCount}
            </p>
          </div>

          <div className="rounded-2xl border bg-background/80 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Action required
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {
                notifications.filter(
                  (notification) =>
                    notification.actionRequired,
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border bg-background/80 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              High priority
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {
                notifications.filter(
                  (notification) =>
                    notification.priority === "High",
                ).length
              }
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            "All",
            "Unread",
            "Action Required",
            "High Priority",
          ].map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={filter === item ? "default" : "outline"}
              onClick={() => setFilter(item)}
            >
              {item}
            </Button>
          ))}
        </div>

        {/* Notification list */}
        <NotificationList
          notifications={filteredNotifications}
          loading={loading}
          onMarkAsRead={handleMarkAsRead}
        />
      </div>
    </AppShell>
  );
}

export default NotificationsPage;