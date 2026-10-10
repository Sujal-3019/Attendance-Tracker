
import { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import EmployeeAppShell from "@/features/employee/layouts/EmployeeAppShell";
import { getMyPayroll } from "@/features/employee/payroll/services/employeePayrollService";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SummaryCard({ title, value, description, icon: Icon }) {
  return (
    <article className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-3 wrap-break-words text-2xl font-semibold tracking-tight">
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Icon className="size-5" />
        </div>
      </div>
    </article>
  );
}

function PayrollBreakdown({ record }) {
  const rows = [
    { label: "Basic salary", amount: record.basicSalary, type: "earning" },
    { label: "House rent allowance", amount: record.hra, type: "earning" },
    { label: "Other allowances", amount: record.allowances, type: "earning" },
    { label: "Overtime", amount: record.overtime, type: "earning" },
    { label: "Deductions", amount: record.deductions, type: "deduction" },
  ];

  return (
    <section className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl sm:p-7">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
          <FileText className="size-5" />
        </div>

        <div>
          <h2 className="font-semibold">Salary breakdown</h2>
          <p className="text-sm text-muted-foreground">
            {record.month} {record.year}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <span className="text-muted-foreground">{row.label}</span>

            <span
              className={
                row.type === "deduction"
                  ? "font-medium text-destructive"
                  : "font-medium"
              }
            >
              {row.type === "deduction" ? "− " : "+ "}
              {formatCurrency(row.amount)}
            </span>
          </div>
        ))}

        <div className="border-t border-border/60 pt-4">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold">Net salary</span>
            <span className="text-xl font-semibold tracking-tight">
              {formatCurrency(record.netPay)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function EmployeePayrollPage() {
  const [payroll, setPayroll] = useState({
    employee: null,
    latest: null,
    records: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const loadPayroll = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getMyPayroll();
      setPayroll(result);
      setSelectedRecord(result.latest);
    } catch (err) {
      setError(err.message || "Unable to load payroll information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayroll();
  }, [loadPayroll]);

  const handleDownload = () => {
    setError(
      "Payslip downloads will be available when the backend generates official payslip documents.",
    );
  };

  const latest = payroll.latest;

  return (
    <EmployeeAppShell>
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Employee workspace
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              My Payroll
            </h1>

            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Review your salary, overtime, deductions, and payment history.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={loadPayroll}
            disabled={loading}
          >
            <Clock3 className="mr-2 size-4" />
            Refresh
          </Button>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-border/60 bg-card/70 p-10 text-center text-sm text-muted-foreground">
            Loading payroll information...
          </div>
        ) : !latest ? (
          <div className="rounded-2xl border border-border/60 bg-card/70 p-10 text-center">
            <Wallet className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-4 font-semibold">No payroll records yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your payroll information will appear here when a record is
              available.
            </p>
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <SummaryCard
                title="Latest net salary"
                value={formatCurrency(latest.netPay)}
                description={`${latest.month} ${latest.year}`}
                icon={Wallet}
              />

              <SummaryCard
                title="Gross earnings"
                value={formatCurrency(latest.grossPay)}
                description="Before deductions"
                icon={Banknote}
              />

              <SummaryCard
                title="Overtime earnings"
                value={formatCurrency(latest.overtime)}
                description="Included in latest payroll"
                icon={Clock3}
              />
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <PayrollBreakdown record={selectedRecord || latest} />

              <article className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl sm:p-7">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                    <CalendarDays className="size-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold">Payment information</h2>
                    <p className="text-sm text-muted-foreground">
                      Selected payslip
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  <div>
                    <p className="text-sm text-muted-foreground">Pay period</p>
                    <p className="mt-1 font-medium">
                      {selectedRecord?.month} {selectedRecord?.year}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Payment date</p>
                    <p className="mt-1 font-medium">
                      {formatDate(selectedRecord?.paymentDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Payment status</p>
                    <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5" />
                      {selectedRecord?.status}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleDownload}
                  >
                    <Download className="mr-2 size-4" />
                    Download payslip
                  </Button>

                  <p className="text-xs leading-5 text-muted-foreground">
                    Demo data only. Official payslip generation and downloads
                    will be connected to the backend.
                  </p>
                </div>
              </article>
            </section>

            <section className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
              <div className="border-b border-border/60 p-5 sm:p-6">
                <h2 className="font-semibold">Payroll history</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select a month to view its salary breakdown.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-170 text-left text-sm">
                  <thead className="bg-muted/30 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Pay period</th>
                      <th className="px-5 py-3 font-medium">Gross earnings</th>
                      <th className="px-5 py-3 font-medium">Deductions</th>
                      <th className="px-5 py-3 font-medium">Net salary</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {payroll.records.map((record) => {
                      const selected = selectedRecord?.id === record.id;

                      return (
                        <tr
                          key={record.id}
                          className={`border-t border-border/50 ${selected ? "bg-primary/5" : ""}`}
                        >
                          <td className="whitespace-nowrap px-5 py-4 font-medium">
                            {record.month} {record.year}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            {formatCurrency(record.grossPay)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            {formatCurrency(record.deductions)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-medium">
                            {formatCurrency(record.netPay)}
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="size-3.5" />
                              {record.status}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRecord(record)}
                              aria-pressed={selected}
                            >
                              {selected ? "Selected" : "View"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </EmployeeAppShell>
  );
}

export default EmployeePayrollPage;
