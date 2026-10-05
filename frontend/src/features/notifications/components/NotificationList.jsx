import {
    Users,
    AlertTriangle,
    Bell,
    Check,
    Clock3,
    FileCheck2,
    MapPin,
} from "lucide-react";

function getNotificationIcon(type) {
    const icons = {
        LEAVE_REQUEST: FileCheck2,
        FORGOT_CHECKOUT: Clock3,
        ATTENDANCE_CORRECTION: FileCheck2,
        LATE_ATTENDANCE: Clock3,
        ATTENDANCE_ANOMALY: AlertTriangle,
        OVERTIME_REVIEW: Clock3,
        EMPLOYEE_ADDED: Users,
    };

    return icons[type] || Bell;
}

function getNotificationIconStyle(type) {
    const styles = {
        LEAVE_REQUEST:
            "bg-blue-500/10 text-blue-700 dark:text-blue-400",

        FORGOT_CHECKOUT:
            "bg-amber-500/10 text-amber-700 dark:text-amber-400",

        ATTENDANCE_CORRECTION:
            "bg-purple-500/10 text-purple-700 dark:text-purple-400",

        LATE_ATTENDANCE:
            "bg-blue-500/10 text-blue-700 dark:text-blue-400",

        ATTENDANCE_ANOMALY:
            "bg-red-500/10 text-red-700 dark:text-red-400",

        OVERTIME_REVIEW:
            "bg-orange-500/10 text-orange-700 dark:text-orange-400",

        EMPLOYEE_ADDED:
            "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    };

    return (
        styles[type] ||
        "bg-muted text-muted-foreground"
    );
}

function formatNotificationDate(dateString) {
    const date = new Date(dateString);

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function NotificationList({
    notifications = [],
    loading = false,
    onMarkAsRead,
}) {
    if (loading) {
        return (
            <section className="rounded-2xl border bg-background/80 shadow-sm">
                <div className="divide-y">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div
                            key={index}
                            className="animate-pulse p-5"
                        >
                            <div className="flex gap-4">
                                <div className="size-10 rounded-xl bg-muted" />

                                <div className="flex-1 space-y-3">
                                    <div className="h-4 w-1/3 rounded bg-muted" />
                                    <div className="h-3 w-4/5 rounded bg-muted" />
                                    <div className="h-3 w-1/4 rounded bg-muted" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (!notifications.length) {
        return (
            <section className="rounded-2xl border bg-background/80 p-12 text-center shadow-sm">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
                    <Bell className="size-5 text-muted-foreground" />
                </div>

                <h2 className="mt-4 font-semibold">
                    No notifications found
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                    There are no notifications matching your current filters.
                </p>
            </section>
        );
    }

    return (
        <section className="overflow-hidden rounded-2xl border bg-background/80 shadow-sm">
            <div className="divide-y">
                {notifications.map((notification) => {
                    const Icon = getNotificationIcon(
                        notification.type,
                    );

                    const iconStyle =
                        getNotificationIconStyle(
                            notification.type,
                        );

                    const isUnread =
                        notification.status === "Unread";

                    return (
                        <div
                            key={notification.id}
                            className={`p-5 transition-colors hover:bg-muted/20 ${isUnread ? "bg-primary/2.5" : ""
                                }`}
                        >
                            <div className="flex gap-4">
                                <div
                                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
                                >
                                    <Icon className="size-4" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex items-center gap-2">
                                            {isUnread && (
                                                <span className="size-2 rounded-full bg-primary" />
                                            )}

                                            <h3 className="text-sm font-semibold">
                                                {notification.title}
                                            </h3>

                                            {notification.priority === "High" && (
                                                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                                                    High priority
                                                </span>
                                            )}
                                        </div>

                                        <span className="text-xs text-muted-foreground">
                                            {formatNotificationDate(
                                                notification.createdAt,
                                            )}
                                        </span>
                                    </div>

                                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                                        {notification.message}
                                    </p>

                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                                            {notification.recipientName}
                                        </span>

                                        {notification.actionRequired && (
                                            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                                Action required
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {isUnread && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onMarkAsRead(notification)
                                                }
                                                className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-3 text-xs font-medium transition-colors hover:bg-muted"
                                            >
                                                <Check className="size-3.5" />
                                                Mark as read
                                            </button>
                                        )}

                                        {notification.actionRequired && (
                                            <button
                                                type="button"
                                                className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-3 text-xs font-medium transition-colors hover:bg-muted"
                                            >
                                                {notification.type === "ATTENDANCE_ANOMALY" ||
                                                    notification.type === "FORGOT_CHECKOUT" ? (
                                                    <MapPin className="size-3.5" />
                                                ) : (
                                                    <Check className="size-3.5" />
                                                )}

                                                Review
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default NotificationList;