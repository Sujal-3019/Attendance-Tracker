
import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
  Send,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import EmployeeAppShell from "@/features/employee/layouts/EmployeeAppShell";
import { getMyLeaves, applyForLeave } from "@/features/employee/leaves/services/employeeLeaveService";

const leaveTypes = ["Casual Leave", "Sick Leave", "Earned Leave"];

function formatDate(value) {
  if (!value) return "—";

  return new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function StatusBadge({ status }) {
  const styles = {
    Approved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    Pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    Rejected: "bg-destructive/10 text-destructive",
  };

  const Icon =
    status === "Approved"
      ? CheckCircle2
      : status === "Rejected"
        ? XCircle
        : Clock3;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] || "bg-muted text-muted-foreground"}`}
    >
      <Icon className="size-3.5" />
      {status}
    </span>
  );
}

function BalanceCard({ balance }) {
  const remaining = Math.max(0, balance.allowance - balance.used);
  const percentage =
    balance.allowance > 0
      ? Math.min(100, (balance.used / balance.allowance) * 100)
      : 0;

  return (
    <article className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{balance.type}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {remaining}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              days left
            </span>
          </p>
        </div>

        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
          <CalendarDays className="size-5" />
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{balance.used} used</span>
        <span>{balance.allowance} total</span>
      </div>
    </article>
  );
}

const initialForm = {
  type: "Casual Leave",
  startDate: "",
  endDate: "",
  reason: "",
};

function EmployeeLeavesPage() {
  const [data, setData] = useState({ balances: [], requests: [] });
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getMyLeaves();
      setData(result);
    } catch (err) {
      setError(err.message || "Unable to load leave information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (form.startDate < getToday()) {
      setError("Leave start date cannot be in the past.");
      return;
    }

    if (form.endDate < form.startDate) {
      setError("End date cannot be before the start date.");
      return;
    }

    setSubmitting(true);

    try {
      const request = await applyForLeave(form);

      setData((previous) => ({
        ...previous,
        requests: [request, ...previous.requests],
      }));

      setForm(initialForm);
      setShowForm(false);
      setStatusFilter("All");
      setNotice("Your leave request has been submitted for approval.");
    } catch (err) {
      setError(err.message || "Unable to submit your leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests =
    statusFilter === "All"
      ? data.requests
      : data.requests.filter((request) => request.status === statusFilter);

  const pendingCount = data.requests.filter(
    (request) => request.status === "Pending",
  ).length;

  const approvedCount = data.requests.filter(
    (request) => request.status === "Approved",
  ).length;

  const rejectedCount = data.requests.filter(
    (request) => request.status === "Rejected",
  ).length;

  return (
    <EmployeeAppShell>
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Employee workspace
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              My Leaves
            </h1>

            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              View your leave balances and manage time-off requests.
            </p>
          </div>

          <Button onClick={() => {
            setError("");
            setNotice("");
            setShowForm((visible) => !visible);
          }}>
            <Plus className="mr-2 size-4" />
            {showForm ? "Close form" : "Apply for leave"}
          </Button>
        </header>

        {error && (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {notice && (
          <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm">
            <CheckCircle2 className="mr-2 inline size-4" />
            {notice}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading leave balances...</p>
          ) : (
            data.balances.map((balance) => (
              <BalanceCard key={balance.type} balance={balance} />
            ))
          )}
        </section>

        {showForm && (
          <section className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">New leave request</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Submit your request for your manager to review.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="leave-type" className="text-sm font-medium">
                    Leave type
                  </label>

                  <select
                    id="leave-type"
                    name="type"
                    value={form.type}
                    onChange={updateField}
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    {leaveTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="leave-start" className="text-sm font-medium">
                    Start date
                  </label>

                  <input
                    id="leave-start"
                    name="startDate"
                    type="date"
                    min={getToday()}
                    value={form.startDate}
                    onChange={updateField}
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="leave-end" className="text-sm font-medium">
                    End date
                  </label>

                  <input
                    id="leave-end"
                    name="endDate"
                    type="date"
                    min={form.startDate || getToday()}
                    value={form.endDate}
                    onChange={updateField}
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="leave-reason" className="text-sm font-medium">
                    Reason
                  </label>

                  <textarea
                    id="leave-reason"
                    name="reason"
                    value={form.reason}
                    onChange={updateField}
                    rows={3}
                    minLength={5}
                    maxLength={500}
                    placeholder="Briefly explain why you need leave..."
                    className="w-full resize-y rounded-xl border border-input bg-background px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />

                  <p className="text-right text-xs text-muted-foreground">
                    {form.reason.length}/500 characters
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={submitting}>
                  <Send className="mr-2 size-4" />
                  {submitting ? "Submitting..." : "Submit request"}
                </Button>
              </div>
            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 p-5 sm:p-6">
            <div>
              <h2 className="font-semibold">Leave request history</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Track your submitted requests.
              </p>
            </div>

            <select
              aria-label="Filter leave requests by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="All">All requests</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-4 px-5 py-4 text-xs text-muted-foreground sm:px-6">
            <span>{data.requests.length} total</span>
            <span>{pendingCount} pending</span>
            <span>{approvedCount} approved</span>
            <span>{rejectedCount} rejected</span>
          </div>

          {loading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Loading leave requests...
            </p>
          ) : filteredRequests.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No requests found for this filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-180 text-left text-sm">
                <thead className="bg-muted/30 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Leave type</th>
                    <th className="px-5 py-3 font-medium">Dates</th>
                    <th className="px-5 py-3 font-medium">Days</th>
                    <th className="px-5 py-3 font-medium">Applied on</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="border-t border-border/50">
                      <td className="px-5 py-4">
                        <p className="font-medium">{request.type}</p>
                        <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                          {request.reason}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {formatDate(request.startDate)}
                        {request.startDate !== request.endDate && (
                          <> – {formatDate(request.endDate)}</>
                        )}
                      </td>

                      <td className="px-5 py-4">{request.days}</td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {formatDate(request.appliedOn)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={request.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </EmployeeAppShell>
  );
}

export default EmployeeLeavesPage;
