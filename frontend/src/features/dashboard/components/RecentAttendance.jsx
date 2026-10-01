import { CheckCircle2, Clock3, MapPin, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";


function RecentAttendance({ records = [] }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
      <div className="flex flex-col gap-4 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Recent attendance
          </h2>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Latest attendance activity from your workforce.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-lg sm:w-auto"
        >
          View all attendance
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-212.5 text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left">
              <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground">
                Employee
              </th>

              <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground">
                Department
              </th>

              <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground">
                Check in
              </th>

              <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground">
                Check out
              </th>

              <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground">
                Work hours
              </th>

              <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground">
                Location
              </th>

              <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground">
                Status
              </th>

              <th className="w-10 px-3 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => (
              <AttendanceRow key={record.id} record={record} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AttendanceRow({ record }) {
  const isLate = record.status === "Late";

  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
            {record.initials}
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">
              {record.employee}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-xs text-muted-foreground">
        {record.department}
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2 text-xs">
          <Clock3 className="size-3.5 text-muted-foreground" />
          <span>{record.checkIn}</span>
        </div>
      </td>

      <td className="px-5 py-4 text-xs">
        {record.checkOut}
      </td>

      <td className="px-5 py-4 text-xs font-medium">
        {record.hours}
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 text-emerald-500" />
          <span>{record.location}</span>
        </div>
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={record.status} isLate={isLate} />
      </td>

      <td className="px-3 py-4">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg"
          aria-label={`Actions for ${record.employee}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </td>
    </tr>
  );
}

function StatusBadge({ status, isLate }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        isLate
          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      }`}
    >
      <CheckCircle2 className="size-3" />
      {status}
    </span>
  );
}

export default RecentAttendance;