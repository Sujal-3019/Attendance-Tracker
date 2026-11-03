import { CalendarDays } from "lucide-react";

function AttendanceHeader({ selectedDate, onToday }) {
  const dateLabel = selectedDate
    ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Loading attendance date...";

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">
          {dateLabel}
        </p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Attendance
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Monitor employee attendance, working hours and location verification.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onToday}
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-xs font-medium shadow-sm backdrop-blur-sm transition-colors hover:bg-card"
        >
          <CalendarDays className="size-3.5 text-muted-foreground" />
          Today
        </button>
      </div>
    </div>
  );
}

export default AttendanceHeader;