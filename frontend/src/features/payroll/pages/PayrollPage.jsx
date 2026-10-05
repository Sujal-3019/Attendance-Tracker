import { useEffect, useMemo, useState } from "react";
import {
    CheckCircle2,
    Clock3,
    UserRound,
} from "lucide-react";

import AppShell from "@/app/layouts/AppShell";
import { Button } from "@/components/ui/button";

import PayrollFilters from "../components/PayrollFilters";
import PayrollHeader from "../components/PayrollHeader";
import PayrollSummary from "../components/PayrollSummary";
import PayrollTable from "../components/PayrollTable";
import OvertimeReviewDialog from "../components/OvertimeReviewDialog";

import {
    getPayrollEmployees,
    getPayrollSummary,
} from "../services/payrollService";

import { getOvertimeRequests } from "../services/overtimeService";

function PayrollPage() {
    const today = new Date();

    const [month, setMonth] = useState(
        today.getMonth() + 1,
    );
    const [year, setYear] = useState(
        today.getFullYear(),
    );

    const [employees, setEmployees] = useState([]);
    const [summary, setSummary] = useState(null);

    const [overtimeRequests, setOvertimeRequests] =
        useState([]);
    const [overtimeLoading, setOvertimeLoading] =
        useState(true);
    const [selectedOvertime, setSelectedOvertime] =
        useState(null);
    const [overtimeDialogOpen, setOvertimeDialogOpen] =
        useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [filters, setFilters] = useState({
        search: "",
        department: "All",
        wageModel: "All",
        payrollStatus: "All",
    });

    useEffect(() => {
        async function loadPayroll() {
            try {
                setLoading(true);
                setError("");

                const [
                    employeesData,
                    summaryData,
                ] = await Promise.all([
                    getPayrollEmployees(),
                    getPayrollSummary(),
                ]);

                setEmployees(employeesData);
                setSummary(summaryData);
            } catch (loadError) {
                setError(
                    loadError.message ||
                    "Unable to load payroll data.",
                );
            } finally {
                setLoading(false);
            }
        }

        loadPayroll();
    }, [month, year]);

    useEffect(() => {
        async function loadOvertimeRequests() {
            try {
                setOvertimeLoading(true);

                const data = await getOvertimeRequests();

                setOvertimeRequests(data);
            } catch {
                setOvertimeRequests([]);
            } finally {
                setOvertimeLoading(false);
            }
        }

        loadOvertimeRequests();
    }, []);

    function handleFilterChange(key, value) {
        setFilters((currentFilters) => ({
            ...currentFilters,
            [key]: value,
        }));
    }

    function handleClearFilters() {
        setFilters({
            search: "",
            department: "All",
            wageModel: "All",
            payrollStatus: "All",
        });
    }

    const filteredEmployees = useMemo(() => {
        const search = filters.search
            .trim()
            .toLowerCase();

        return employees.filter((employee) => {
            const matchesSearch =
                !search ||
                employee.name
                    .toLowerCase()
                    .includes(search) ||
                employee.employeeId
                    .toLowerCase()
                    .includes(search) ||
                employee.employeeCode
                    .toLowerCase()
                    .includes(search);

            const matchesDepartment =
                filters.department === "All" ||
                employee.department ===
                filters.department;

            const matchesWageModel =
                filters.wageModel === "All" ||
                employee.wageModel ===
                filters.wageModel;

            let payrollStatus = "Ready";

            if (
                employee.unpaidLeaveDays > 0 ||
                employee.totalDeductions >
                employee.baseEarnings * 0.1
            ) {
                payrollStatus = "Needs Review";
            }

            const matchesStatus =
                filters.payrollStatus === "All" ||
                payrollStatus ===
                filters.payrollStatus;

            return (
                matchesSearch &&
                matchesDepartment &&
                matchesWageModel &&
                matchesStatus
            );
        });
    }, [employees, filters]);

    const pendingOvertimeRequests =
        overtimeRequests.filter(
            (request) =>
                request.overtimeStatus === "Pending",
        );

    function handleReviewOvertime(request) {
        setSelectedOvertime(request);
        setOvertimeDialogOpen(true);
    }

    function handleOvertimeUpdated(updatedRequest) {
        setOvertimeRequests((currentRequests) =>
            currentRequests.map((request) =>
                request.id === updatedRequest.id
                    ? updatedRequest
                    : request,
            ),
        );
    }

    function handleRunPayroll() {
        window.alert(
            `Payroll run for ${month}/${year} will be handled by the backend.`,
        );
    }

    function handleExport() {
        window.alert(
            `Payroll export for ${month}/${year} will be handled by the backend.`,
        );
    }

    return (
        <AppShell>
            <div className="space-y-6">
                <PayrollHeader
                    month={month}
                    year={year}
                    onMonthChange={setMonth}
                    onYearChange={setYear}
                    onRunPayroll={handleRunPayroll}
                    onExport={handleExport}
                />

                {error && (
                    <div
                        role="alert"
                        className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    >
                        {error}
                    </div>
                )}

                <PayrollSummary
                    summary={summary}
                    loading={loading}
                />

                <PayrollFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClear={handleClearFilters}
                />

                {/* Overtime Review */}
                <section className="overflow-hidden rounded-2xl border bg-background/80 shadow-sm">
                    <div className="border-b px-5 py-4 sm:px-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Clock3 className="size-4 text-muted-foreground" />

                                    <h2 className="text-base font-semibold">
                                        Overtime review
                                    </h2>
                                </div>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Review overtime before it is included in
                                    employee payroll.
                                </p>
                            </div>

                            {pendingOvertimeRequests.length > 0 && (
                                <span className="w-fit rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                                    {pendingOvertimeRequests.length} pending
                                </span>
                            )}
                        </div>
                    </div>

                    {overtimeLoading ? (
                        <div className="space-y-3 p-5">
                            {Array.from({ length: 2 }).map(
                                (_, index) => (
                                    <div
                                        key={index}
                                        className="animate-pulse rounded-xl border p-4"
                                    >
                                        <div className="space-y-3">
                                            <div className="h-4 w-1/3 rounded bg-muted" />
                                            <div className="h-3 w-2/3 rounded bg-muted" />
                                            <div className="h-3 w-1/2 rounded bg-muted" />
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    ) : overtimeRequests.length === 0 ? (
                        <div className="px-5 py-10 text-center sm:px-6">
                            <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-muted">
                                <Clock3 className="size-5 text-muted-foreground" />
                            </div>

                            <p className="mt-3 text-sm font-medium">
                                No overtime requests
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                                There are currently no overtime records
                                requiring review.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop */}
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/20 text-left">
                                            <th className="px-5 py-3 font-medium text-muted-foreground">
                                                Employee
                                            </th>

                                            <th className="px-5 py-3 font-medium text-muted-foreground">
                                                Date
                                            </th>

                                            <th className="px-5 py-3 font-medium text-muted-foreground">
                                                Source
                                            </th>

                                            <th className="px-5 py-3 font-medium text-muted-foreground">
                                                Scheduled end
                                            </th>

                                            <th className="px-5 py-3 font-medium text-muted-foreground">
                                                Actual checkout
                                            </th>

                                            <th className="px-5 py-3 font-medium text-muted-foreground">
                                                Status
                                            </th>

                                            <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y">
                                        {overtimeRequests.map(
                                            (request) => (
                                                <tr
                                                    key={request.id}
                                                    className="transition-colors hover:bg-muted/20"
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                                <UserRound className="size-4" />
                                                            </div>

                                                            <div>
                                                                <p className="font-medium">
                                                                    {request.employeeName}
                                                                </p>

                                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                                    {
                                                                        request.employeeCode
                                                                    }{" "}
                                                                    ·{" "}
                                                                    {
                                                                        request.department
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4 text-muted-foreground">
                                                        {
                                                            request.attendanceDate
                                                        }
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span className="rounded-md bg-muted px-2 py-1 text-xs">
                                                            {request.source}
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        {
                                                            request.scheduledEndTime
                                                        }
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        {request.checkOut ? (
                                                            <span className="font-medium">
                                                                {request.checkOut}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                Not recorded
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        {request.overtimeStatus ===
                                                            "Approved" ? (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                                                <CheckCircle2 className="size-3.5" />
                                                                Approved
                                                            </span>
                                                        ) : request.overtimeStatus ===
                                                            "Rejected" ? (
                                                            <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                                                                Rejected
                                                            </span>
                                                        ) : (
                                                            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                                                                Pending
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4 text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleReviewOvertime(
                                                                    request,
                                                                )
                                                            }
                                                        >
                                                            Review
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile */}
                            <div className="divide-y md:hidden">
                                {overtimeRequests.map(
                                    (request) => (
                                        <div
                                            key={request.id}
                                            className="space-y-4 p-5"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                        <UserRound className="size-4" />
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {
                                                                request.employeeName
                                                            }
                                                        </p>

                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {
                                                                request.employeeCode
                                                            }
                                                        </p>
                                                    </div>
                                                </div>

                                                <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                                                    {
                                                        request.overtimeStatus
                                                    }
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="rounded-lg bg-muted/30 p-3">
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Check-in
                                                    </p>

                                                    <p className="mt-1 text-xs font-medium">
                                                        {request.checkIn}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg bg-muted/30 p-3">
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Scheduled end
                                                    </p>

                                                    <p className="mt-1 text-xs font-medium">
                                                        {request.scheduledEndTime}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg bg-muted/30 p-3">
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Actual checkout
                                                    </p>

                                                    <p className="mt-1 text-xs font-medium">
                                                        {request.checkOut || "Not recorded"}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg bg-muted/30 p-3">
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Source
                                                    </p>

                                                    <p className="mt-1 text-xs font-medium">
                                                        {request.source}
                                                    </p>
                                                </div>
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                                onClick={() =>
                                                    handleReviewOvertime(
                                                        request,
                                                    )
                                                }
                                            >
                                                Review overtime
                                            </Button>
                                        </div>
                                    ),
                                )}
                            </div>
                        </>
                    )}
                </section>

                <PayrollTable
                    employees={filteredEmployees}
                    loading={loading}
                />

                <OvertimeReviewDialog
                    request={selectedOvertime}
                    open={overtimeDialogOpen}
                    onOpenChange={setOvertimeDialogOpen}
                    onUpdated={handleOvertimeUpdated}
                />
            </div>
        </AppShell>
    );
}

export default PayrollPage;