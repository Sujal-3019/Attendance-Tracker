import { Search, SlidersHorizontal } from "lucide-react";

import { Input } from "@/components/ui/input";

function EmployeeFilters({
  search,
  setSearch,
  department,
  setDepartment,
  status,
  setStatus,
  workMode,
  setWorkMode,
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/55 p-4 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="size-4 text-muted-foreground" />

        <p className="text-sm font-semibold">Employee directory</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative md:col-span-2 xl:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employees..."
            className="h-10 rounded-xl pl-9"
          />
        </div>

        <select
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring"
        >
          <option value="all">All departments</option>
          <option value="Engineering">Engineering</option>
          <option value="Human Resources">Human Resources</option>
          <option value="Sales">Sales</option>
          <option value="Finance">Finance</option>
          <option value="Operations">Operations</option>
          <option value="Design">Design</option>
          <option value="Marketing">Marketing</option>
        </select>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring"
        >
          <option value="all">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <select
          value={workMode}
          onChange={(event) => setWorkMode(event.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring"
        >
          <option value="all">All work modes</option>
          <option value="Office">Office</option>
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
        </select>
      </div>
    </div>
  );
}

export default EmployeeFilters;