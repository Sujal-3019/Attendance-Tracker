
import { CheckCheck } from "lucide-react";
import { useMemo, useState } from "react";

import AppShell from "@/app/layouts/AppShell";
import { Button } from "@/components/ui/button";

import NotificationList from "../components/NotificationList";
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
} from "../hooks/useNotifications";

function NotificationsPage() {
  const [filter, setFilter] = useState("All");

  const {
    data: notifications = [],
    isPending,
    isError,
    error,
    refetch,
  } = useNotifications();

  const markOneMutation = useMarkNotificationAsRead();
  const markAllMutation = useMarkAllNotificationsAsRead();

  const unreadCount = notifications.filter(
    (notification) => notification.status === "Unread",
  ).length;

  const filteredNotifications = useMemo(() => {
    if (filter === "Unread") {
      return notifications.filter(
        (notification) => notification.status === "Unread",
      );
    }

    if (filter === "Action Required") {
      return notifications.filter(
        (notification) => notification.actionRequired,
      );
    }

    if (filter === "High Priority") {
      return notifications.filter(
        (notification) => notification.priority === "High",
      );
    }

    return notifications;
  }, [notifications, filter]);

  function handleMarkAsRead(notification) {
    if (
      notification.status !== "Unread" ||
      markOneMutation.isPending
    ) {
      return;
    }

    markOneMutation.mutate(notification.id);
  }

  function handleMarkAllAsRead() {
    if (!markAllMutation.isPending) {
      markAllMutation.mutate();
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
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
              disabled={markAllMutation.isPending}
            >
              <CheckCheck className="size-4" />
              {markAllMutation.isPending
                ? "Updating..."
                : "Mark all as read"}
            </Button>
          )}
        </div>

        {isError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <span>
              {error?.message || "Unable to load notifications."}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              Try again
            </Button>
          </div>
        )}

        {(markOneMutation.isError || markAllMutation.isError) && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {markOneMutation.error?.message ||
              markAllMutation.error?.message ||
              "Unable to update notifications. Please try again."}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border bg-background/80 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="mt-1 text-2xl font-semibold">
              {notifications.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-background/80 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Unread</p>
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
                  (notification) => notification.actionRequired,
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

        <NotificationList
          notifications={filteredNotifications}
          loading={isPending}
          onMarkAsRead={handleMarkAsRead}
        />
      </div>
    </AppShell>
  );
}

export default NotificationsPage;
