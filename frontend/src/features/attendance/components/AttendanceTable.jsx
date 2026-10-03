import {
  CheckCircle2,
  Clock3,
  MapPin,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const filters = ["All", "Present", "Late", "On Leave", "Absent"];

function AttendanceTable({ records = [] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        !query ||
        record.employee.toLowerCase().includes(query) ||
        record.department.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
      <div className="border-b border-border/60 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Attendance records
            </h2>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Search and filter employee attendance.
            </p>
          </div>

          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee..."
              className="h-9 rounded-lg pl-9 text-xs"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
          {filters.map((filter) => {
            const active = statusFilter === filter;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-237.5 text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left">
              <TableHeading>Employee</TableHeading>
              <TableHeading>Department</TableHeading>
              <TableHeading>Date</TableHeading>
              <TableHeading>Check in</TableHeading>
              <TableHeading>Check out</TableHeading>
              <TableHeading>Work hours</TableHeading>
              <TableHeading>Location</TableHeading>
              <TableHeading>Status</TableHeading>
              <th className="w-10 px-3 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <AttendanceRow key={record.id} record={record} />
              ))
            ) : (
              <tr>
                <td
                  colSpan={9}
                  className="px-5 py-12 text-center text-sm text-muted-foreground"
                >
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TableHeading({ children }) {
  return (
    <th className="px-5 py-3 text-[11px] font-medium text-muted-foreground">
      {children}
    </th>
  );
}

function AttendanceRow({ record }) {
  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
            {record.initials}
          </div>

          <div>
            <p className="text-xs font-semibold">{record.employee}</p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-xs text-muted-foreground">
        {record.department}
      </td>

      <td className="px-5 py-4 text-xs">{record.date}</td>

      <td className="px-5 py-4">
        <TimeCell value={record.checkIn} />
      </td>

      <td className="px-5 py-4 text-xs">{record.checkOut}</td>

      <td className="px-5 py-4 text-xs font-medium">{record.hours}</td>

      <td className="px-5 py-4">
        {record.location !== "—" ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 text-emerald-500" />
            {record.location}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={record.status} />
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

function TimeCell({ value }) {
  if (value === "—") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <Clock3 className="size-3.5 text-muted-foreground" />
      {value}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Present:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    Late: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    "On Leave": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    Absent: "bg-red-500/10 text-red-700 dark:text-red-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        styles[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      <CheckCircle2 className="size-3" />
      {status}
    </span>
  );
}

export default AttendanceTable;