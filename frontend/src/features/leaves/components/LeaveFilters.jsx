import { Search, SlidersHorizontal } from "lucide-react";

import { Input } from "@/components/ui/input";

function LeaveFilters({
  search,
  setSearch,
  department,
  setDepartment,
  leaveType,
  setLeaveType,
  status,
  setStatus,
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/55 p-4 shadow-sm backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="size-4" />
        <h2 className="text-sm font-semibold">Filters</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative md:col-span-2 xl:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employee..."
            className="h-10 rounded-xl pl-9"
          />
        </div>

        <select
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
        >
          <option value="">All departments</option>
          <option value="Engineering">Engineering</option>
          <option value="Human Resources">Human Resources</option>
          <option value="Sales">Sales</option>
          <option value="Finance">Finance</option>
          <option value="Operations">Operations</option>
          <option value="Design">Design</option>
          <option value="Marketing">Marketing</option>
        </select>

        <select
          value={leaveType}
          onChange={(event) => setLeaveType(event.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
        >
          <option value="">All leave types</option>
          <option value="Casual Leave">Casual Leave</option>
          <option value="Sick Leave">Sick Leave</option>
          <option value="Earned Leave">Earned Leave</option>
          <option value="Unpaid Leave">Unpaid Leave</option>
        </select>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
        >
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>
    </section>
  );
}

export default LeaveFilters;