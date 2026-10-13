import {
    ArrowRight,
    CalendarDays,
    CalendarCheck,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    WalletCards,
    UserRound,
    Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useEffect, useState } from "react";
import { getMySalaryProjection } from "@/features/employee/payroll/services/employeePayrollService";

import EmployeeAppShell from "@/features/employee/layouts/EmployeeAppShell";
import { useAuth } from "@/features/auth/context/AuthContext";

const employeeFeatures = [
    {
        title: "My Attendance",
        description: "Check in, check out, and review your attendance history.",
        icon: ClipboardCheck,
        href: "/employee/attendance",
        label: "Open attendance",
    },
    {
        title: "My Leaves",
        description: "Request time off and keep track of your leave applications.",
        icon: CalendarDays,
        href: "/employee/leaves",
        label: "Manage leaves",
    },
    {
        title: "My Payroll",
        description: "Review your salary, deductions, overtime, and payslips.",
        icon: WalletCards,
        href: "/employee/payroll",
        label: "View payroll",
    },
    {
        title: "My Profile",
        description: "View your employment information and update your contact details.",
        icon: UserRound,
        href: "/employee/profile",
        label: "View profile",
    },
];

function EmployeeDashboardPage() {
    const { user } = useAuth();


    const [salaryProjection, setSalaryProjection] = useState(null);
    const [salaryLoading, setSalaryLoading] = useState(true);
    const [salaryError, setSalaryError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function loadSalaryProjection() {
            try {
                const data = await getMySalaryProjection();

                if (isMounted) {
                    setSalaryProjection(data);
                }
            } catch (error) {
                if (isMounted) {
                    setSalaryError(true);
                }
            } finally {
                if (isMounted) {
                    setSalaryLoading(false);
                }
            }
        }

        loadSalaryProjection();

        return () => {
            isMounted = false;
        };
    }, []);

    const formatCurrency = (amount) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: salaryProjection?.currency || "INR",
            maximumFractionDigits: 0,
        }).format(amount ?? 0);


    const employeeName =
        user?.name?.trim()?.split(/\s+/)[0] || "there";

    const today = new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date());

    return (
        <EmployeeAppShell>
            <div className="mx-auto max-w-7xl space-y-8">
                {/* Welcome header */}
                <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                            <Sparkles className="size-3.5" />
                            Employee workspace
                        </div>

                        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                            Good to see you, {employeeName}.
                        </h1>

                        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                            Here’s your personal workspace at a glance.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/70 px-4 py-3 shadow-sm backdrop-blur-xl">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                            <CalendarCheck className="size-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Today</p>
                            <p className="text-sm font-medium">{today}</p>
                        </div>
                    </div>
                </header>


                {/* Projected salary */}
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
                    <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.3fr_1fr] lg:items-center">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                                    <WalletCards className="size-5" />
                                </div>

                                <span className="text-sm font-medium text-muted-foreground">
                                    Projected salary
                                </span>

                                <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                    Estimated
                                </span>
                            </div>

                            <p className="mt-5 text-sm text-muted-foreground">
                                Estimated take-home pay
                                {salaryProjection
                                    ? ` · ${salaryProjection.period.month} ${salaryProjection.period.year}`
                                    : ""}
                            </p>

                            {salaryLoading ? (
                                <div
                                    className="mt-2 h-10 w-48 animate-pulse rounded-lg bg-muted"
                                    aria-label="Loading salary projection"
                                />
                            ) : salaryError || !salaryProjection ? (
                                <p className="mt-3 text-sm text-muted-foreground">
                                    Salary projection is temporarily unavailable. Please try again later.
                                </p>
                            ) : (
                                <>
                                    <p className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                                        {formatCurrency(salaryProjection.netPay)}
                                    </p>

                                    <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                                        Your estimated salary after currently configured additions and
                                        deductions. The final amount may change when payroll is finalized.
                                    </p>
                                </>
                            )}

                            <Link
                                to="/employee/payroll"
                                className="mt-5 inline-flex items-center gap-2 text-sm font-medium hover:underline"
                            >
                                View salary breakdown
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                                <p className="text-xs text-muted-foreground">Gross earnings</p>

                                <p className="mt-2 text-lg font-semibold">
                                    {salaryLoading || salaryError || !salaryProjection
                                        ? "—"
                                        : formatCurrency(salaryProjection.grossPay)}
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    Before deductions
                                </p>
                            </div>

                            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                                <p className="text-xs text-muted-foreground">Total deductions</p>

                                <p className="mt-2 text-lg font-semibold">
                                    {salaryLoading || salaryError || !salaryProjection
                                        ? "—"
                                        : formatCurrency(salaryProjection.totalDeductions)}
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    Currently configured
                                </p>
                            </div>

                            {!salaryLoading && !salaryError && salaryProjection && (
                                <div className="col-span-2 rounded-xl bg-muted/40 px-4 py-3">
                                    <div className="flex items-start gap-2">
                                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                                        <p className="text-xs leading-5 text-muted-foreground">
                                            {salaryProjection.note}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>


                {/* Daily overview */}
                <section>
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold">Your day at a glance</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Access your daily tasks and employee records.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <article className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Attendance
                                    </p>
                                    <p className="mt-2 text-lg font-semibold">
                                        Ready to check in?
                                    </p>
                                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                                        Record your workday and review your attendance.
                                    </p>
                                </div>

                                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                                    <Clock3 className="size-5" />
                                </div>
                            </div>

                            <Link
                                to="/employee/attendance"
                                className="mt-5 inline-flex items-center gap-2 text-sm font-medium hover:underline"
                            >
                                Open attendance
                                <ArrowRight className="size-4" />
                            </Link>
                        </article>

                        <article className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Leave management
                                    </p>
                                    <p className="mt-2 text-lg font-semibold">
                                        Planning time off?
                                    </p>
                                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                                        Apply for leave and check the status of your requests.
                                    </p>
                                </div>

                                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                                    <CalendarDays className="size-5" />
                                </div>
                            </div>

                            <Link
                                to="/employee/leaves"
                                className="mt-5 inline-flex items-center gap-2 text-sm font-medium hover:underline"
                            >
                                Manage leaves
                                <ArrowRight className="size-4" />
                            </Link>
                        </article>

                        <article className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl sm:col-span-2 xl:col-span-1">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Payroll
                                    </p>
                                    <p className="mt-2 text-lg font-semibold">
                                        Salary information
                                    </p>
                                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                                        Review your earnings, deductions, and available payslips.
                                    </p>
                                </div>

                                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                                    <WalletCards className="size-5" />
                                </div>
                            </div>

                            <Link
                                to="/employee/payroll"
                                className="mt-5 inline-flex items-center gap-2 text-sm font-medium hover:underline"
                            >
                                View payroll
                                <ArrowRight className="size-4" />
                            </Link>
                        </article>
                    </div>
                </section>

                {/* Quick actions */}
                <section className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl sm:p-7">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold">Quick actions</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Get where you need to go in one click.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                label: "View attendance",
                                detail: "Check today's record",
                                href: "/employee/attendance",
                                icon: ClipboardCheck,
                            },
                            {
                                label: "Apply for leave",
                                detail: "Submit a leave request",
                                href: "/employee/leaves",
                                icon: CalendarDays,
                            },
                            {
                                label: "View payslips",
                                detail: "Review salary details",
                                href: "/employee/payroll",
                                icon: WalletCards,
                            },
                            {
                                label: "My profile",
                                detail: "Review your details",
                                href: "/employee/profile",
                                icon: UserRound,
                            },
                        ].map((action) => {
                            const Icon = action.icon;

                            return (
                                <Link
                                    key={action.href}
                                    to={action.href}
                                    className="group flex items-center gap-3 rounded-xl border border-border/60 p-4 transition-colors hover:bg-muted/60"
                                >
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                        <Icon className="size-5" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium">
                                            {action.label}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {action.detail}
                                        </p>
                                    </div>

                                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* Employee modules */}
                <section>
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold">Your workspace</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Everything you need to manage your employment information.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {employeeFeatures.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.title}
                                    to={item.href}
                                    className="group rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                                        <Icon className="size-5" />
                                    </div>

                                    <h3 className="mt-4 font-semibold">{item.title}</h3>

                                    <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
                                        {item.description}
                                    </p>

                                    <div className="mt-4 flex items-center gap-2 text-sm font-medium">
                                        {item.label}
                                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* Helpful reminder */}
                <section className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-muted/30 p-5 sm:flex-row sm:items-center sm:p-6">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm">
                        <CheckCircle2 className="size-5" />
                    </div>

                    <div>
                        <h2 className="font-semibold">Keep your information up to date</h2>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            Make sure your contact information is correct and review your
                            attendance, leave requests, and payslips regularly.
                        </p>
                    </div>

                    <Link
                        to="/employee/profile"
                        className="inline-flex shrink-0 items-center gap-2 text-sm font-medium hover:underline sm:ml-auto"
                    >
                        Review profile
                        <ArrowRight className="size-4" />
                    </Link>
                </section>
            </div>
        </EmployeeAppShell>
    );
}

export default EmployeeDashboardPage;