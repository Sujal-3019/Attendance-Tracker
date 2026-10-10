
import { Bell, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
} from "../hooks/useNotifications";

function NotificationBell() {
  const {
    data: notifications = [],
    isPending,
    isError,
    refetch,
  } = useNotifications();

  const markOneMutation = useMarkNotificationAsRead();
  const markAllMutation = useMarkAllNotificationsAsRead();

  const unreadNotifications = notifications.filter(
    (notification) => notification.status === "Unread",
  );

  function handleNotificationClick(notification) {
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
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative size-9 rounded-lg"
            aria-label={
              unreadNotifications.length > 0
                ? `${unreadNotifications.length} unread notifications`
                : "Notifications"
            }
          />
        }
      >
        <Bell className="size-4" />

        {unreadNotifications.length > 0 && (
          <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground">
            {unreadNotifications.length > 9
              ? "9+"
              : unreadNotifications.length}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[min(380px,calc(100vw-2rem))] p-0"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>

          {unreadNotifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={markAllMutation.isPending}
            >
              <CheckCheck className="size-3.5" />
              {markAllMutation.isPending
                ? "Updating..."
                : "Mark all read"}
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {isPending ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse space-y-2"
              >
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-destructive">
              Unable to load notifications.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => refetch()}
            >
              Try again
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="mx-auto size-7 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">
              You're all caught up
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              No notifications to review.
            </p>
          </div>
        ) : (
          <div className="max-h-105 overflow-y-auto">
            {notifications.slice(0, 5).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="cursor-pointer items-start gap-3 px-4 py-3"
                onClick={() => handleNotificationClick(notification)}
              >
                <div
                  className={`mt-1 flex size-2 shrink-0 rounded-full ${
                    notification.status === "Unread"
                      ? "bg-primary"
                      : "bg-muted-foreground/30"
                  }`}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">
                      {notification.title}
                    </p>

                    {notification.status === "Unread" && (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        New
                      </span>
                    )}
                  </div>

                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {notification.message}
                  </p>

                  {notification.actionRequired && (
                    <p className="mt-2 text-xs font-medium text-primary">
                      Action required
                    </p>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />

        <div className="p-2">
          <DropdownMenuItem
            render={
              <Link
                to="/notifications"
                className="w-full justify-center text-sm font-medium"
              />
            }
          >
            View all notifications
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;