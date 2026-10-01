import {
  CalendarDays,
  Clock3,
  FileBarChart,
  MapPin,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Location-aware attendance",
    description:
      "Verify attendance against configured workplace locations and geofences before accepting a check-in.",
  },
  {
    icon: Clock3,
    title: "Working hours & overtime",
    description:
      "Track working duration, late arrivals, early exits and overtime with configurable company rules.",
  },
  {
    icon: CalendarDays,
    title: "Leave management",
    description:
      "Employees can request leave while administrators manage approvals, balances and leave history.",
  },
  {
    icon: WalletCards,
    title: "Wage calculations",
    description:
      "Support hourly, daily and monthly wage models with configurable deductions and overtime rules.",
  },
  {
    icon: FileBarChart,
    title: "Reports & insights",
    description:
      "Understand attendance patterns, employee status, working hours and leave activity through reports.",
  },
  {
    icon: ShieldCheck,
    title: "Auditable records",
    description:
      "Keep attendance corrections, approvals and important actions traceable through an audit trail.",
  },
];

function FeatureSection() {
  return (
    <section id="features" className="border-y border-border/50">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Everything in one place
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            More than just a check-in button.
          </h2>

          <p className="mt-4 text-muted-foreground leading-7">
            Build a reliable attendance workflow around the way your
            organization actually operates.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-card/75 hover:shadow-lg"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Icon className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>

                <h3 className="mt-5 font-semibold tracking-tight">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeatureSection;