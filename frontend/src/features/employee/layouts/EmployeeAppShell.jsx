import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
  { label: "Dashboard", path: "/employee/dashboard", icon: LayoutDashboard },
  { label: "My Attendance", path: "/employee/attendance", icon: ClipboardCheck },
  { label: "My Leaves", path: "/employee/leaves", icon: CalendarDays },
  { label: "My Payroll", path: "/employee/payroll", icon: WalletCards },
  { label: "My Profile", path: "/employee/profile", icon: UserRound },
];

export default function EmployeeAppShell({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const displayName = user?.name || "Employee";
  const displayEmail = user?.email || "Employee account";

  function handleLogout() {
    closeMobileMenu();
    logout();
    navigate("/login", { replace: true });
  }

  function renderNavigation() {
    return navigation.map(({ label, path, icon: Icon }) => (
      <NavLink
        key={path}
        to={path}
        end
        onClick={closeMobileMenu}
        className={({ isActive }) =>
          [
            "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
            isActive
              ? "border border-cyan-200/70 bg-linear-to-r from-cyan-50 to-blue-50 text-cyan-900 shadow-sm dark:border-cyan-800/60 dark:from-cyan-950/70 dark:to-blue-950/50 dark:text-cyan-100"
              : "border border-transparent text-slate-600 hover:border-cyan-100 hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800/70 dark:hover:text-white",
          ].join(" ")
        }
      >
        <Icon
          size={19}
          className="shrink-0 transition-transform group-hover:scale-105"
        />
        <span>{label}</span>
      </NavLink>
    ));
  }

  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-[#faf8f2] text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {/* Glacier Mist - Aura background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl dark:bg-cyan-700/10" />
        <div className="absolute -right-32 top-24 h-96 w-96 rounded-full bg-blue-200/25 blur-3xl dark:bg-blue-700/10" />
        <div className="absolute -bottom-40 left-[35%] h-96 w-96 rounded-full bg-teal-200/20 blur-3xl dark:bg-teal-700/10" />
      </div>

      {/* Mobile and tablet header */}
      <header className="relative z-30 flex h-16 items-center justify-between border-b border-white/70 bg-[#faf8f2]/85 px-3 backdrop-blur-xl sm:px-5 lg:hidden dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-controls="employee-navigation"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="shrink-0 rounded-xl"
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </Button>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 text-white shadow-sm">
            <LayoutDashboard size={18} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight">
              Attendance Tracker
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Employee workspace
            </p>
          </div>
        </div>

        <div className="ml-2 shrink-0">
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile and tablet backdrop */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 cursor-default bg-slate-900/30 backdrop-blur-[2px] lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Responsive sidebar drawer */}
      <aside
        id="employee-navigation"
        aria-label="Employee sidebar"
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col",
          "border-r border-white/80 bg-[#faf8f2]/95 shadow-2xl shadow-cyan-950/10 backdrop-blur-2xl",
          "transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-950/95",
          "lg:translate-x-0 lg:shadow-none",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200/60 px-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-900/10">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">
                Attendance Tracker
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Employee workspace
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl lg:hidden"
            aria-label="Close navigation menu"
            onClick={closeMobileMenu}
          >
            <X size={20} />
          </Button>
        </div>

        <nav
          aria-label="Employee navigation"
          className="flex-1 space-y-1 overflow-y-auto p-4"
        >
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Workspace
          </p>
          {renderNavigation()}
        </nav>

        <div className="shrink-0 border-t border-slate-200/60 p-4 dark:border-slate-800">
          <div className="mb-3 flex min-w-0 items-center gap-3 rounded-xl border border-white/80 bg-white/60 p-3 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-cyan-100 to-blue-100 font-semibold text-cyan-800 dark:from-cyan-900 dark:to-blue-900 dark:text-cyan-100">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {displayEmail}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2 rounded-xl border-slate-200/80 bg-white/60 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-800"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main workspace */}
      <div className="relative z-10 min-w-0 lg:pl-72">
        {/* Desktop header */}
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-white/70 bg-[#faf8f2]/75 px-8 backdrop-blur-xl lg:flex dark:border-slate-800/80 dark:bg-slate-950/75">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Welcome back,{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {displayName}
            </span>
          </p>

          <ThemeToggle />
        </header>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}