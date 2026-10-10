
import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LogIn,
  LogOut,
  RefreshCw,
} from "lucide-react";

import EmployeeAppShell from "@/features/employee/layouts/EmployeeAppShell";
import { Button } from "@/components/ui/button";

import {
  checkIn,
  checkOut,
  getMyAttendance,
} from "@/features/employee/attendance/services/employeeAttendanceService";

function formatTime(value) {
  if (!value) return "--:--";

  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(start, end) {
  if (!start || !end) return "In progress";

  const minutes = Math.max(
    0,
    Math.floor((new Date(end) - new Date(start)) / 60000),
  );

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

function getCurrentDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function SummaryCard({ title, value, description, icon: Icon }) {
  return (
    <article className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight">
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Icon className="size-5" />
        </div>
      </div>
    </article>
  );
}

function EmployeeAttendancePage() {
  const [attendance, setAttendance] = useState({
    today: null,
    history: [],
  });
  const [clock, setClock] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getMyAttendance();
      setAttendance(result);
    } catch (err) {
      setError(err.message || "Unable to load your attendance.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setClock(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const today = attendance.today;
  const hasCheckedIn = Boolean(today?.checkIn);
  const hasCheckedOut = Boolean(today?.checkOut);

  const handleAttendanceAction = async (action) => {
    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      const record =
        action === "check-in" ? await checkIn() : await checkOut();

      setAttendance((previous) => ({
        ...previous,
        today: record,
        history: [
          record,
          ...previous.history.filter((item) => item.id !== record.id),
        ],
      }));

      setNotice(
        action === "check-in"
          ? `Check-in recorded at ${formatTime(record.checkIn)}.`
          : `Check-out recorded at ${formatTime(record.checkOut)}.`,
      );
    } catch (err) {
      setError(err.message || "Unable to record your attendance.");
    } finally {
      setActionLoading(false);
    }
  };

  const completedDays = attendance.history.filter(
    (record) => record.checkIn && record.checkOut,
  ).length;

  const totalHoursMinutes = attendance.history.reduce((total, record) => {
    if (!record.checkIn || !record.checkOut) return total;

    return (
      total +
      Math.max(
        0,
        Math.floor(
          (new Date(record.checkOut) - new Date(record.checkIn)) / 60000,
        ),
      )
    );
  }, 0);

  const totalHours = Math.floor(totalHoursMinutes / 60);
  const remainingMinutes = totalHoursMinutes % 60;

  return (
    <EmployeeAppShell>
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Employee workspace
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              My Attendance
            </h1>

            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Record your workday and review your attendance history.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={loadAttendance}
            disabled={loading || actionLoading}
          >
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm"
          >
            <CheckCircle2 className="mr-2 inline size-4 text-emerald-600" />
            {notice}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            title="Today's check-in"
            value={formatTime(today?.checkIn)}
            description={
              hasCheckedIn ? "Your check-in is recorded" : "Not checked in yet"
            }
            icon={LogIn}
          />

          <SummaryCard
            title="Today's check-out"
            value={formatTime(today?.checkOut)}
            description={
              hasCheckedOut ? "Your workday is complete" : "Awaiting check-out"
            }
            icon={LogOut}
          />

          <SummaryCard
            title="Today's work duration"
            value={
              hasCheckedIn
                ? formatDuration(
                    today.checkIn,
                    today.checkOut || clock.toISOString(),
                  )
                : "0h 0m"
            }
            description={
              hasCheckedIn && !hasCheckedOut
                ? "Duration updates while you work"
                : "Based on recorded attendance"
            }
            icon={Clock3}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarDays className="size-5" />
              </div>

              <div>
                <h2 className="font-semibold">Today's workday</h2>
                <p className="text-sm text-muted-foreground">
                  {clock.toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="my-7 text-center">
              <p className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                {clock.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
              </p>

              <p className="mt-3 text-sm text-muted-foreground">
                {hasCheckedOut
                  ? "Your workday has been completed."
                  : hasCheckedIn
                    ? "Your workday is in progress."
                    : "Ready to start your workday?"}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                className="h-12"
                disabled={loading || actionLoading || hasCheckedIn}
                onClick={() => handleAttendanceAction("check-in")}
              >
                <ArrowDownRight className="mr-2 size-4" />
                {actionLoading && !hasCheckedIn
                  ? "Recording..."
                  : "Check In"}
              </Button>

              <Button
                variant="outline"
                className="h-12"
                disabled={
                  loading ||
                  actionLoading ||
                  !hasCheckedIn ||
                  hasCheckedOut
                }
                onClick={() => handleAttendanceAction("check-out")}
              >
                <ArrowUpRight className="mr-2 size-4" />
                Check Out
              </Button>
            </div>

            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Demo mode: these actions use temporary mock data. Official
              attendance records will be validated and saved by the backend.
            </p>
          </article>

          <article className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl sm:p-7">
            <h2 className="font-semibold">Today's status</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your current attendance state.
            </p>

            <div className="mt-6 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Status</span>

                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  {hasCheckedOut
                    ? "Completed"
                    : hasCheckedIn
                      ? "Checked in"
                      : "Not started"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Check-in time
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {formatTime(today?.checkIn)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Check-out time
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {formatTime(today?.checkOut)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Work duration
                </span>
                <span className="text-sm font-medium">
                  {hasCheckedIn
                    ? formatDuration(
                        today.checkIn,
                        today.checkOut || clock.toISOString(),
                      )
                    : "--"}
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-muted/50 p-4">
              <p className="text-sm font-medium">Attendance reminder</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Remember to check out before leaving. Office location,
                working schedules, late arrival rules, and remote-work
                policies will be applied when backend validation is added.
              </p>
            </div>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-5 sm:p-6">
            <div>
              <h2 className="font-semibold">Recent attendance</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your latest attendance records.
              </p>
            </div>

            <span className="text-xs text-muted-foreground">
              {completedDays} completed records
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading attendance...
            </div>
          ) : attendance.history.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No attendance records yet. Check in to start your first workday.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-155 text-left text-sm">
                <thead className="bg-muted/30 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Check-in</th>
                    <th className="px-5 py-3 font-medium">Check-out</th>
                    <th className="px-5 py-3 font-medium">Duration</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {attendance.history.map((record) => (
                    <tr
                      key={record.id}
                      className="border-t border-border/50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-medium">
                        {formatDate(record.date)}
                        {record.date === getCurrentDateKey() && (
                          <span className="ml-2 text-xs text-primary">
                            Today
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 tabular-nums">
                        {formatTime(record.checkIn)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 tabular-nums">
                        {formatTime(record.checkOut)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {formatDuration(record.checkIn, record.checkOut)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                          {record.checkOut
                            ? "Completed"
                            : record.checkIn
                              ? "In progress"
                              : record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </EmployeeAppShell>
  );
}

export default EmployeeAttendancePage;
