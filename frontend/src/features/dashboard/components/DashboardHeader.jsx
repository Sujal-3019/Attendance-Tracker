import { CalendarDays, MapPin } from "lucide-react";

function DashboardHeader() {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Monday, 01 October 2026</p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Good afternoon, Admin
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Here's an overview of your workforce attendance and activity today.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-xs font-medium shadow-sm backdrop-blur-sm">
          <CalendarDays className="size-3.5 text-muted-foreground" />
          <span>Today</span>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-xs font-medium shadow-sm backdrop-blur-sm">
          <MapPin className="size-3.5 text-muted-foreground" />
          <span>All locations</span>
        </div>
      </div>
    </div>
  );
}

export default DashboardHeader;