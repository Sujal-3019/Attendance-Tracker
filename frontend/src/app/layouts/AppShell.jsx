import {
    CalendarDays,
    ClipboardCheck,
    LayoutDashboard,
    Menu,
    Settings,
    Users,
    WalletCards,
    X,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/shared/ThemeToggle";

const navigation = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Attendance",
        href: "/attendance",
        icon: ClipboardCheck,
    },
    {
        label: "Employees",
        href: "/employees",
        icon: Users,
    },
    {
        label: "Leaves",
        href: "/leaves",
        icon: CalendarDays,
    },
    {
        label: "Payroll",
        href: "/payroll",
        icon: WalletCards,
    },
    {
        label: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

function AppShell({ children }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen text-foreground">
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border/60 bg-card/70 backdrop-blur-xl lg:flex lg:flex-col">
                <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
            </aside>

            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <button
                    type="button"
                    aria-label="Close navigation"
                    onClick={() => setMobileMenuOpen(false)}
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden"
                />
            )}

            {/* Mobile sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-70 flex-col border-r border-border/60 bg-card/85 shadow-2xl backdrop-blur-2xl transition-transform duration-200 lg:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
                    <Brand />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 rounded-lg"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Close navigation"
                    >
                        <X className="size-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                    <Navigation onNavigate={() => setMobileMenuOpen(false)} />
                </div>

                <UserPanel />
            </aside>

            {/* Main area */}
            <div className="min-h-screen lg:pl-64">
                <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border/50 bg-background/45 px-4 backdrop-blur-xl sm:px-6">
                    <div className="flex flex-1 items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-lg lg:hidden"
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label="Open navigation"
                        >
                            <Menu className="size-5" />
                        </Button>

                        <div className="lg:hidden">
                            <Brand compact />
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <ThemeToggle />

                        <div className="ml-1 hidden h-8 w-px bg-border sm:block" />

                        <button
                            type="button"
                            className="ml-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted"
                        >
                            <div className="flex size-8 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                                DA
                            </div>

                            <div className="hidden leading-tight sm:block">
                                <p className="text-xs font-semibold">Demo Admin</p>
                                <p className="text-[10px] text-muted-foreground">Administrator</p>
                            </div>
                        </button>
                    </div>
                </header>

                <main className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
                    <div className="mx-auto w-full max-w-[1600px]">{children}</div>
                </main>
            </div>
        </div>
    );
}

function SidebarContent() {
    return (
        <>
            <div className="flex h-16 items-center border-b border-border/60 px-5">
                <Brand />
            </div>

            <div className="flex-1 overflow-y-auto p-3">
                <Navigation />
            </div>

            <UserPanel />
        </>
    );
}

function Brand({ compact = false }) {
    return (
        <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-background shadow-sm">
                <ClipboardCheck className="size-4" />
            </div>

            {!compact && (
                <div>
                    <p className="text-sm font-semibold tracking-tight">Attendly</p>
                    <p className="text-[10px] font-medium text-muted-foreground">
                        Workforce management
                    </p>
                </div>
            )}
        </Link>
    );
}

function Navigation({ onNavigate }) {
    return (
        <nav className="space-y-1">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Workspace
            </p>

            {navigation.map((item) => {
                const Icon = item.icon;

                return (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                            [
                                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-foreground text-background shadow-sm"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            ].join(" ")
                        }
                    >
                        <Icon className="size-4.5" />
                        <span>{item.label}</span>
                    </NavLink>
                );
            })}
        </nav>
    );
}

function UserPanel() {
    return (
        <div className="border-t border-border/60 p-3">
            <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                    DA
                </div>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">Demo Admin</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                        admin@attendly.demo
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AppShell;