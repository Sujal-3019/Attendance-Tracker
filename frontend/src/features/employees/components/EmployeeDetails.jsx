import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";

function getInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getStatusClasses(status) {
  if (status === "Active") {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  }

  return "bg-muted text-muted-foreground";
}

function getAttendanceStatusClasses(status) {
  if (status === "Present") {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  }

  if (status === "Late") {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
  }

  if (status === "On Leave") {
    return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
  }

  return "bg-muted text-muted-foreground";
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/70">
        <Icon className="size-4 text-muted-foreground" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 wrap-break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function EmployeeDetails({ employee }) {
  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        to="/employees"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to employees
      </Link>

      {/* Profile header */}
      <section className="rounded-2xl border border-border/60 bg-card/55 p-5 shadow-sm backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-foreground text-base font-semibold text-background sm:size-16">
              {getInitials(employee.name)}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {employee.name}
                </h1>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                    employee.status,
                  )}`}
                >
                  {employee.status}
                </span>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {employee.designation} · {employee.department}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Employee ID: {employee.id}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl border border-border bg-background/60 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Edit employee
            </button>

            <button
              type="button"
              className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {employee.status === "Active"
                ? "Deactivate"
                : "Activate"}
            </button>
          </div>
        </div>
      </section>

      {/* Main information */}
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        {/* Employment information */}
        <section className="rounded-2xl border border-border/60 bg-card/55 p-5 shadow-sm backdrop-blur-sm sm:p-6">
          <div className="mb-6">
            <p className="text-sm font-semibold">Employee information</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Basic contact and employment details.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <InfoItem
              icon={Mail}
              label="Email address"
              value={employee.email}
            />

            <InfoItem
              icon={Phone}
              label="Phone number"
              value={employee.phone}
            />

            <InfoItem
              icon={BriefcaseBusiness}
              label="Employment type"
              value={employee.employmentType}
            />

            <InfoItem
              icon={UserRound}
              label="Manager"
              value={employee.manager}
            />

            <InfoItem
              icon={CalendarDays}
              label="Joining date"
              value={employee.joiningDate}
            />

            <InfoItem
              icon={Clock3}
              label="Work mode"
              value={employee.workMode}
            />

            <InfoItem
              icon={MapPin}
              label="Assigned location"
              value={employee.location}
            />
          </div>
        </section>

        {/* Attendance summary */}
        <section className="rounded-2xl border border-border/60 bg-card/55 p-5 shadow-sm backdrop-blur-sm sm:p-6">
          <div className="mb-6">
            <p className="text-sm font-semibold">Attendance summary</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Current attendance overview.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SummaryItem
              label="Present"
              value={employee.attendance.present}
            />

            <SummaryItem
              label="Late"
              value={employee.attendance.late}
            />

            <SummaryItem
              label="Absent"
              value={employee.attendance.absent}
            />

            <SummaryItem
              label="Leave"
              value={employee.attendance.leave}
            />
          </div>
        </section>
      </div>

      {/* Recent attendance */}
      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card/55 shadow-sm backdrop-blur-sm">
        <div className="border-b border-border/60 p-5 sm:p-6">
          <p className="text-sm font-semibold">Recent attendance</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Latest attendance records for this employee.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-175 text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left">
                <th className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                  Date
                </th>
                <th className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                  Check-in
                </th>
                <th className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                  Check-out
                </th>
                <th className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                  Work hours
                </th>
                <th className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/50">
              {employee.recentAttendance.map((record) => (
                <tr key={record.date} className="hover:bg-muted/35">
                  <td className="px-5 py-4 font-medium">{record.date}</td>

                  <td className="px-5 py-4 text-muted-foreground">
                    {record.checkIn}
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">
                    {record.checkOut}
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">
                    {record.workHours}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${getAttendanceStatusClasses(
                        record.status,
                      )}`}
                    >
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Leave summary */}
      <section className="rounded-2xl border border-border/60 bg-card/55 p-5 shadow-sm backdrop-blur-sm sm:p-6">
        <div className="mb-6">
          <p className="text-sm font-semibold">Leave balance</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Current allocation and usage by leave type.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <LeaveCard
            title="Casual leave"
            data={employee.leaveSummary.casual}
          />

          <LeaveCard
            title="Sick leave"
            data={employee.leaveSummary.sick}
          />

          <LeaveCard
            title="Earned leave"
            data={employee.leaveSummary.earned}
          />
        </div>
      </section>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/35 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function LeaveCard({ title, data }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/35 p-4">
      <p className="text-sm font-semibold">{title}</p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-[11px] text-muted-foreground">Allocated</p>
          <p className="mt-1 text-sm font-semibold">{data.allocated}</p>
        </div>

        <div>
          <p className="text-[11px] text-muted-foreground">Used</p>
          <p className="mt-1 text-sm font-semibold">{data.used}</p>
        </div>

        <div>
          <p className="text-[11px] text-muted-foreground">Remaining</p>
          <p className="mt-1 text-sm font-semibold">{data.remaining}</p>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDetails;