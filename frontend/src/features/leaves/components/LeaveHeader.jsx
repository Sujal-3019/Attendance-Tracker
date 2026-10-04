import { CalendarDays } from "lucide-react";

function LeaveHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          <span>Leave management</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Leave requests
        </h1>

        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Review employee leave requests, manage approvals, and monitor leave
          activity across your organization.
        </p>
      </div>
    </div>
  );
}

export default LeaveHeader;