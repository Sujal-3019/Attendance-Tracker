
import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  History,
  Wallet,
} from "lucide-react";

import EmployeeAppShell from "../../layouts/EmployeeAppShell";
import { getMyProfile } from "../../profile/services/employeeProfileService";
import { getEmployeeSalaryAdvances } from "@/features/payroll/services/salaryAdvanceService";

const currency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function SummaryCard({ label, value, description, icon: Icon }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>

          <p className="mt-2 wrap-break-words text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={19} />
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ status }) {
  const styles =
    status === "Repaid"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : status === "Cancelled"
        ? "border-border bg-muted text-muted-foreground"
        : "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      {status}
    </span>
  );
}

export default function EmployeeAdvancesPage() {
  const [profile, setProfile] = useState(null);
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setError("");

        const employeeProfile = await getMyProfile();
        const employeeAdvances = await getEmployeeSalaryAdvances(
          employeeProfile.employeeId,
        );

        if (!active) return;

        setProfile(employeeProfile);
        setAdvances(employeeAdvances);
      } catch {
        if (active) {
          setError("Unable to load your salary advances. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const activeAdvances = advances.filter(
    (advance) => advance.status === "Active",
  );

  const totalOutstanding = advances.reduce(
    (total, advance) => total + advance.outstandingBalance,
    0,
  );

  const totalRepaid = advances.reduce(
    (total, advance) => total + advance.totalRepaid,
    0,
  );

  const monthlyDeduction = activeAdvances.reduce(
    (total, advance) =>
      total +
      Math.min(advance.monthlyDeduction, advance.outstandingBalance),
    0,
  );

  return (
    <EmployeeAppShell>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* Page heading */}
        <header>
          <p className="text-sm font-medium text-primary">
            Employee self-service
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            My Advances
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Track your salary advances, repayments, and upcoming deductions.
          </p>
        </header>

        {/* Loading state */}
        {loading ? (
          <div className="rounded-2xl border border-border/70 bg-card p-8 text-sm text-muted-foreground shadow-sm">
            Loading your salary advances...
          </div>
        ) : error ? (
          /* Error state */
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {error}
          </div>
        ) : (
          <>
            {/* Employee information */}
            <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-colors sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Wallet size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Employee account
                    </p>

                    <h2 className="mt-1 wrap-break-words text-lg font-semibold text-foreground">
                      {profile?.fullName}
                    </h2>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3 sm:min-w-40">
                  <p className="text-xs text-muted-foreground">
                    Employee ID
                  </p>

                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {profile?.employeeId}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-border/60 pt-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  Your advance information is read-only. Contact your
                  administrator if you have questions about a repayment.
                </p>
              </div>
            </section>

            {/* Summary cards */}
            <section
              aria-label="Salary advance summary"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <SummaryCard
                label="Outstanding balance"
                value={currency(totalOutstanding)}
                description="Amount still to be repaid"
                icon={Wallet}
              />

              <SummaryCard
                label="Total repaid"
                value={currency(totalRepaid)}
                description="Repayments recorded so far"
                icon={CheckCircle2}
              />

              <SummaryCard
                label="Monthly deduction"
                value={currency(monthlyDeduction)}
                description="Planned across active advances"
                icon={CalendarDays}
              />

              <SummaryCard
                label="Active advances"
                value={activeAdvances.length}
                description={`${advances.length} total advance record(s)`}
                icon={Clock3}
              />
            </section>

            {/* Advance history */}
            <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-colors">
              <div className="border-b border-border/70 px-5 py-5 sm:px-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Advance history
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Review each advance, repayment progress, and remaining balance.
                </p>
              </div>

              {advances.length === 0 ? (
                <div className="px-5 py-14 text-center sm:px-8">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-border/70 bg-muted/50 text-muted-foreground">
                    <Wallet size={24} />
                  </div>

                  <h3 className="mt-4 font-semibold text-foreground">
                    No salary advances found
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    You don&apos;t have any salary advances recorded for your
                    employee account yet. Contact your administrator if you
                    believe this is incorrect.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/70">
                  {advances.map((advance) => {
                    const progress =
                      advance.originalAmount > 0
                        ? Math.min(
                            100,
                            (advance.totalRepaid / advance.originalAmount) *
                              100,
                          )
                        : 0;

                    return (
                      <article
                        key={advance.id}
                        className="space-y-5 p-5 transition-colors hover:bg-muted/10 sm:p-6"
                      >
                        {/* Advance heading */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-md border border-border/70 bg-muted/50 px-2 py-1 text-xs font-medium text-muted-foreground">
                                {advance.id}
                              </span>

                              <StatusBadge status={advance.status} />
                            </div>

                            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                              {currency(advance.originalAmount)}
                            </h3>

                            <p className="mt-1 text-sm text-muted-foreground">
                              Original advance amount
                            </p>
                          </div>

                          <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 sm:min-w-36">
                            <p className="text-xs text-muted-foreground">
                              Issued on
                            </p>

                            <p className="mt-1 text-sm font-medium text-foreground">
                              {formatDate(advance.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Financial details */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                            <p className="text-sm text-muted-foreground">
                              Outstanding balance
                            </p>

                            <p className="mt-2 wrap-break-words text-xl font-semibold text-foreground">
                              {currency(advance.outstandingBalance)}
                            </p>
                          </div>

                          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                            <p className="text-sm text-muted-foreground">
                              Total repaid
                            </p>

                            <p className="mt-2 wrap-break-words text-xl font-semibold text-foreground">
                              {currency(advance.totalRepaid)}
                            </p>
                          </div>

                          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                            <p className="text-sm text-muted-foreground">
                              Monthly deduction
                            </p>

                            <p className="mt-2 wrap-break-words text-xl font-semibold text-foreground">
                              {currency(advance.monthlyDeduction)}
                            </p>

                            <p className="mt-2 text-xs text-muted-foreground">
                              Starts{" "}
                              {formatDate(`${advance.startMonth}-01`)}
                            </p>
                          </div>
                        </div>

                        {/* Repayment progress */}
                        <section
                          aria-label="Repayment progress"
                          className="rounded-xl border border-border/60 p-4 sm:p-5"
                        >
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-semibold text-foreground">
                                Repayment progress
                              </h4>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {currency(advance.totalRepaid)} of{" "}
                                {currency(advance.originalAmount)} repaid
                              </p>
                            </div>

                            <span className="text-sm font-semibold tabular-nums text-primary">
                              {Math.round(progress)}%
                            </span>
                          </div>

                          <div
                            className="h-2.5 overflow-hidden rounded-full bg-muted"
                            role="progressbar"
                            aria-label={`Repayment progress for ${advance.id}`}
                            aria-valuenow={Math.round(progress)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </section>

                        {/* Reason */}
                        {advance.reason && (
                          <div className="rounded-xl border border-border/60 px-4 py-3">
                            <p className="text-xs font-medium text-muted-foreground">
                              Reason for advance
                            </p>

                            <p className="mt-1 text-sm text-foreground">
                              {advance.reason}
                            </p>
                          </div>
                        )}

                        {/* Repayment history */}
                        <div className="border-t border-border/70 pt-5">
                          <div className="flex items-center gap-2">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <History size={17} />
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-foreground">
                                Repayment history
                              </h4>

                              <p className="text-xs text-muted-foreground">
                                Recorded repayment transactions
                              </p>
                            </div>
                          </div>

                          {advance.repayments?.length ? (
                            <div className="mt-4 overflow-hidden rounded-xl border border-border/70">
                              {advance.repayments.map((repayment, index) => (
                                <div
                                  key={repayment.id}
                                  className={[
                                    "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
                                    index > 0 ? "border-t border-border/60" : "",
                                    "transition-colors hover:bg-muted/30",
                                  ].join(" ")}
                                >
                                  <div className="flex min-w-0 items-start gap-3">
                                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                      <CheckCircle2 size={16} />
                                    </div>

                                    <div className="min-w-0">
                                      <p className="wrap-break-words text-sm font-medium text-foreground">
                                        {repayment.method}
                                      </p>

                                      <p className="mt-1 text-xs text-muted-foreground">
                                        {formatDate(repayment.date)}
                                      </p>

                                      {repayment.note && (
                                        <p className="mt-1 wrap-break-words text-xs leading-5 text-muted-foreground">
                                          {repayment.note}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground sm:text-right">
                                    {currency(repayment.amount)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-4 rounded-xl border border-dashed border-border p-5 text-center">
                              <p className="text-sm text-muted-foreground">
                                No repayments recorded yet.
                              </p>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </EmployeeAppShell>
  );
}
