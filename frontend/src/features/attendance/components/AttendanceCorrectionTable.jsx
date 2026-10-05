import { CheckCircle2, Clock3, Eye, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

function AttendanceCorrectionTable({
  requests,
  loading,
  onReview,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border bg-background/80 p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-48 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-5/6 rounded bg-muted" />
          <div className="h-4 w-4/6 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border bg-background/80 shadow-sm">
      <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Clock3 className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">
              Attendance correction requests
            </h2>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Review employee requests to change attendance records.
          </p>
        </div>

        <span className="w-fit rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
          {requests.filter((request) => request.status === "Pending").length}{" "}
          pending
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <CheckCircle2 className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">
            No correction requests
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            There are no attendance correction requests to review.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Employee</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Requested change</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b last:border-0"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium">
                          {request.employeeName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {request.employeeCode} · {request.department}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {request.attendanceDate}
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-xs">
                        <p>
                          Check-in:{" "}
                          <span className="font-medium">
                            {request.originalCheckIn || "—"}
                          </span>
                          {" → "}
                          <span className="font-medium text-primary">
                            {request.requestedCheckIn || "—"}
                          </span>
                        </p>

                        <p className="mt-1">
                          Check-out:{" "}
                          <span className="font-medium">
                            {request.originalCheckOut || "—"}
                          </span>
                          {" → "}
                          <span className="font-medium text-primary">
                            {request.requestedCheckOut || "—"}
                          </span>
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={request.status} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReview(request)}
                      >
                        <Eye className="size-3.5" />
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y md:hidden">
            {requests.map((request) => (
              <div key={request.id} className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {request.employeeName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {request.employeeCode} · {request.department}
                    </p>
                  </div>

                  <StatusBadge status={request.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">
                      Date
                    </p>
                    <p className="mt-1 font-medium">
                      {request.attendanceDate}
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">
                      Request
                    </p>
                    <p className="mt-1 font-medium">
                      {request.id}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border p-3 text-xs">
                  <p className="text-muted-foreground">
                    Requested change
                  </p>

                  <p className="mt-2">
                    Check-in:{" "}
                    <span className="font-medium">
                      {request.originalCheckIn || "—"}
                    </span>
                    {" → "}
                    <span className="font-medium text-primary">
                      {request.requestedCheckIn || "—"}
                    </span>
                  </p>

                  <p className="mt-1">
                    Check-out:{" "}
                    <span className="font-medium">
                      {request.originalCheckOut || "—"}
                    </span>
                    {" → "}
                    <span className="font-medium text-primary">
                      {request.requestedCheckOut || "—"}
                    </span>
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onReview(request)}
                >
                  <Eye className="size-4" />
                  Review request
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Pending:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    Approved:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    Rejected:
      "bg-red-500/10 text-red-700 dark:text-red-400",
  };

  const icons = {
    Pending: Clock3,
    Approved: CheckCircle2,
    Rejected: XCircle,
  };

  const Icon = icons[status] || Clock3;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        styles[status] ||
          "bg-muted text-muted-foreground",
      ].join(" ")}
    >
      <Icon className="size-3.5" />
      {status}
    </span>
  );
}

export default AttendanceCorrectionTable;