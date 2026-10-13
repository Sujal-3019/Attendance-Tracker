import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { useAuth } from "@/features/auth/context/AuthContext";

const navigation = [
  {
    label: "Dashboard",
    href: "/employee/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Attendance",
    href: "/employee/attendance",
    icon: ClipboardCheck,
  },
  {
    label: "My Leaves",
    href: "/employee/leaves",
    icon: CalendarDays,
  },
  {
    label: "My Payroll",
    href: "/employee/payroll",
    icon: WalletCards,
  },
  {
    label: "My Profile",
    href: "/employee/profile",
    icon: UserRound,
  },
];

function Brand({ compact = false }) {
  return (
    <Link
      to="/employee/dashboard"
      className="flex min-w-0 items-center gap-2.5"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-background shadow-sm">
        <ClipboardCheck className="size-4" />
      </div>

      {!compact && (
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight">Attendly</p>
          <p className="text-[10px] font-medium text-muted-foreground">
            Employee workspace
          </p>
        </div>
      )}
    </Link>
  );
}

function EmployeeNavigation({ onNavigate }) {
  return (
    <nav aria-label="Employee navigation" className="space-y-1">
      <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Workspace
      </p>

      {navigation.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.href}
            to={item.href}
            end
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
            <Icon className="size-4.5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function EmployeeUserPanel({ user, onLogout }) {
  const displayName = user?.name || "Employee";
  const displayEmail = user?.email || "Employee account";

  return (
    <div className="border-t border-border/60 p-3">
      <div className="mb-2 flex min-w-0 items-center gap-3 rounded-xl bg-muted/60 p-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{displayName}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {displayEmail}
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        className="w-full justify-start gap-2 rounded-xl text-muted-foreground hover:text-foreground"
        onClick={onLogout}
      >
        <LogOut className="size-4" />
        Sign out
      </Button>
    </div>
  );
}

export default function EmployeeAppShell({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const closeMobileMenu = () => setMobileMenuOpen(false);

  function handleLogout() {
    closeMobileMenu();
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/60 bg-card/70 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center border-b border-border/60 px-5">
          <Brand />
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <EmployeeNavigation />
        </div>

        <EmployeeUserPanel user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile/tablet overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Mobile/tablet sidebar */}
      <aside
        id="employee-mobile-navigation"
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col",
          "border-r border-border/60 bg-card/85 shadow-2xl backdrop-blur-2xl",
          "transition-transform duration-200 lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
          <Brand />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 rounded-lg"
            onClick={closeMobileMenu}
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <EmployeeNavigation onNavigate={closeMobileMenu} />
        </div>

        <EmployeeUserPanel user={user} onLogout={handleLogout} />
      </aside>

      {/* Main area */}
      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border/50 bg-background/45 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 rounded-lg lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
              aria-controls="employee-mobile-navigation"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="size-5" />
            </Button>

            <div className="min-w-0 lg:hidden">
              <Brand compact />
            </div>

            <p className="hidden truncate text-sm text-muted-foreground lg:block">
              Welcome back,{" "}
              <span className="font-semibold text-foreground">
                {user?.name || "Employee"}
              </span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <ThemeToggle />

            <div className="ml-1 hidden h-8 w-px bg-border sm:block" />

            <div className="ml-1 hidden items-center gap-2 rounded-lg px-2 py-1.5 sm:flex">
              <div className="flex size-8 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                {(user?.name || "Employee").charAt(0).toUpperCase()}
              </div>

              <div className="hidden leading-tight md:block">
                <p className="text-xs font-semibold">
                  {user?.name || "Employee"}
                </p>
                <p className="text-[10px] text-muted-foreground">Employee</p>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}