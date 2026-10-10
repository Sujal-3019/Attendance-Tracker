
import {
    CalendarDays,
    ClipboardCheck,
    WalletCards,
} from "lucide-react";
import EmployeeAppShell from "@/features/employee/layouts/EmployeeAppShell";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useNavigate } from "react-router-dom";

const employeeFeatures = [
    {
        title: "My Attendance",
        description: "Check in, check out, and review your attendance history.",
        icon: ClipboardCheck,
    },
    {
        title: "My Leaves",
        description: "Apply for leave and track your requests.",
        icon: CalendarDays,
    },
    {
        title: "My Payroll",
        description: "Review your earnings, deductions, and overtime.",
        icon: WalletCards,
    },
];

function EmployeeDashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <EmployeeAppShell>
            <div className="mx-auto max-w-6xl space-y-8">
                <header>
                    <p className="text-sm font-medium text-muted-foreground">
                        Employee workspace
                    </p>

                    <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                        Welcome to your dashboard
                    </h1>

                    <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                        Manage your attendance, leave requests, and payroll information.
                    </p>
                </header>

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {employeeFeatures.map((item) => {
                        const Icon = item.icon;

                        return (
                            <article
                                key={item.title}
                                className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl transition-shadow hover:shadow-md sm:p-6"
                            >
                                <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                                    <Icon className="size-5" />
                                </div>

                                <h2 className="mt-4 font-semibold">{item.title}</h2>

                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    {item.description}
                                </p>
                            </article>
                        );
                    })}
                </section>

                <section className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-xl sm:p-8">
                    <h2 className="text-lg font-semibold">Your workspace is ready</h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Your personal workspace is being prepared. Attendance actions,
                        leave requests, and payroll details will be connected to
                        employee-specific services as we build each module.
                    </p>
                </section>
            </div>
        </EmployeeAppShell>
    );
}

export default EmployeeDashboardPage;
