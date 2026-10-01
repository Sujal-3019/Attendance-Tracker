import { ArrowRight, Building2, Clock3, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

const roles = [
  {
    title: "I'm an Admin",
    description:
      "Set up your organization, manage employees, configure attendance rules and oversee workforce activity.",
    icon: Building2,
    features: [
      "Create and manage your organization",
      "Manage employees and teams",
      "Configure attendance & leave rules",
      "View workforce reports",
    ],
    href: "/register/admin",
  },
  {
    title: "I'm an Employee",
    description:
      "Track your attendance, working hours, leave requests and personal workforce records.",
    icon: UserRound,
    features: [
      "Mark attendance securely",
      "View working hours",
      "Request and track leave",
      "View your attendance history",
    ],
    href: "/register/employee",
  },
];

function RegisterPage() {
  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col justify-center">
        {/* Header */}
        <div className="mx-auto w-full max-w-2xl text-center">
          <Link
            to="/"
            className="mx-auto mb-8 flex w-fit items-center gap-2"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background shadow-sm">
              <Clock3 className="size-4" />
            </div>

            <span className="text-sm font-semibold tracking-tight">
              Attendly
            </span>
          </Link>

          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Create your account
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            How will you use Attendly?
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Choose the account type that matches your role. You can configure
            the rest of your workforce settings after registration.
          </p>
        </div>

        {/* Role cards */}
        <div className="mx-auto mt-10 grid w-full max-w-4xl gap-5 md:grid-cols-2">
          {roles.map((role) => {
            const Icon = role.icon;

            return (
              <div
                key={role.title}
                className="group relative flex flex-col rounded-3xl border border-border/60 bg-card/60 p-6 shadow-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-xl sm:p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10">
                    <Icon className="size-6 text-emerald-600 dark:text-emerald-400" />
                  </div>

                  <ShieldCheck className="size-5 text-muted-foreground/50 transition-colors group-hover:text-emerald-500/70" />
                </div>

                <h2 className="mt-6 text-xl font-semibold tracking-tight">
                  {role.title}
                </h2>

                <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
                  {role.description}
                </p>

                <div className="my-6 h-px bg-border/60" />

                <ul className="space-y-3">
                  {role.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to={role.href} className="mt-8">
                  <Button className="w-full rounded-xl" size="lg">
                    Continue as {role.title.replace("I'm an ", "")}
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Login */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
