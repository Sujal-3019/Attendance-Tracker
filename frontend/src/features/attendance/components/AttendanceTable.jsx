import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";

const filters = ["All", "Present", "Late", "On Leave", "Absent"];

function getEmployeeName(record) {
  return record.employeeName || record.employee || "Unknown employee";
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatHours(value) {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toFixed(2)} hrs`;
}

function AttendanceTable({
  records = [],
  selectedDate,
  onDateChange,
  onLoadEmployeeHistory,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedEmployeeId, setExpandedEmployeeId] = useState(null);
  const [employeeHistory, setEmployeeHistory] = useState({});
  const [loadingEmployeeId, setLoadingEmployeeId] = useState(null);
  const [historyError, setHistoryError] = useState("");

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const name = getEmployeeName(record).toLowerCase();
      const department = (record.department || "").toLowerCase();
      const employeeCode = (record.employeeCode || "").toLowerCase();
      const matchesSearch =
        !query ||
        name.includes(query) ||
        department.includes(query) ||
        employeeCode.includes(query);
      const matchesStatus =
        statusFilter === "All" || record.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  async function toggleEmployee(record) {
    const employeeId = record.employeeId;
    if (!employeeId) return;

    if (expandedEmployeeId === employeeId) {
      setExpandedEmployeeId(null);
      return;
    }

    setExpandedEmployeeId(employeeId);
    setHistoryError("");
    if (employeeHistory[employeeId]) return;

    setLoadingEmployeeId(employeeId);
    try {
      const history = await onLoadEmployeeHistory(employeeId);
      setEmployeeHistory((current) => ({ ...current, [employeeId]: history }));
    } catch (error) {
      setHistoryError(error.message || "Unable to load attendance history.");
    } finally {
      setLoadingEmployeeId(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
      <div className="border-b border-border/60 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Attendance records
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Showing attendance for {selectedDate}. Select an employee to view
              records from other dates.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="shrink-0">Filter by date</span>
              <Input
                type="date"
                required
                value={selectedDate}
                onChange={(event) => {
                  if (event.target.value) onDateChange(event.target.value);
                }}
                className="h-9 w-auto rounded-lg text-xs"
                aria-label="Filter attendance by date"
              />
            </label>
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employee..."
                className="h-9 rounded-lg pl-9 text-xs"
              />
            </div>
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
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => {
                const employeeId = record.employeeId || record.employeeCode;
                const isExpanded = expandedEmployeeId === employeeId;
                const history = employeeHistory[employeeId] || [];
                const otherDates = history.filter((item) => item.id !== record.id);
                return (
                  <AttendanceGroup
                    key={record.id}
                    record={record}
                    employeeId={employeeId}
                    isExpanded={isExpanded}
                    history={otherDates}
                    loading={loadingEmployeeId === employeeId}
                    error={isExpanded ? historyError : ""}
                    onToggle={() => toggleEmployee(record)}
                  />
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-12 text-center text-sm text-muted-foreground"
                >
                  No attendance records found for this date.
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

function AttendanceGroup({
  record,
  employeeId,
  isExpanded,
  history,
  loading,
  error,
  onToggle,
}) {
  const employee = getEmployeeName(record);
  const name = employee;
  const checkIn = record.checkIn ?? record.check_in;
  const checkOut = record.checkOut ?? record.check_out;
  const hours = record.workedHours ?? record.worked_hours;

  return (
    <>
      <tr className="border-b border-border/40 last:border-0">
        <td className="px-5 py-4">
          <button
            type="button"
            className="flex items-center gap-3 text-left"
            onClick={onToggle}
            aria-expanded={isExpanded}
            aria-controls={`history-${employeeId}`}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
              {getInitials(name)}
            </div>
            <div>
              <p className="text-xs font-semibold">{name}</p>
              <p className="text-[11px] text-muted-foreground">
                {isExpanded ? "Hide history" : "View history"}
              </p>
            </div>
            {isExpanded ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
          </button>
        </td>
        <td className="px-5 py-4 text-xs text-muted-foreground">
          {record.department || "—"}
        </td>
        <td className="px-5 py-4 text-xs">{record.date}</td>
        <td className="px-5 py-4">
          <TimeCell value={checkIn} />
        </td>
        <td className="px-5 py-4 text-xs">{formatTime(checkOut)}</td>
        <td className="px-5 py-4 text-xs font-medium">{formatHours(hours)}</td>
        <td className="px-5 py-4">
          {record.location ? (
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
      </tr>
      {isExpanded && (
        <tr id={`history-${employeeId}`} className="border-b border-border/40">
          <td colSpan={8} className="bg-muted/20 px-5 py-4">
            <p className="mb-3 text-xs font-semibold">Other attendance dates</p>
            {loading ? (
              <p className="text-xs text-muted-foreground">Loading history...</p>
            ) : error ? (
              <p role="alert" className="text-xs text-destructive">{error}</p>
            ) : history.length ? (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-2 rounded-lg border bg-background/70 p-3 text-xs sm:grid-cols-5"
                  >
                    <span>{item.date}</span>
                    <span>In: {formatTime(item.checkIn ?? item.check_in)}</span>
                    <span>Out: {formatTime(item.checkOut ?? item.check_out)}</span>
                    <span>{formatHours(item.workedHours ?? item.worked_hours)}</span>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No attendance records on other dates.
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function TimeCell({ value }) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-2 text-xs">
      <Clock3 className="size-3.5 text-muted-foreground" />
      {formatTime(value)}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Present: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
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
