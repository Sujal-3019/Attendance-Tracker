import {
  CheckCircle2,
  Clock3,
  UserMinus,
  Users,
} from "lucide-react";

const cards = [
  {
    key: "present",
    label: "Present",
    description: "Checked in today",
    icon: CheckCircle2,
    iconClass:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "late",
    label: "Late",
    description: "After grace period",
    icon: Clock3,
    iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    key: "onLeave",
    label: "On leave",
    description: "Approved leave",
    icon: UserMinus,
    iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    key: "absent",
    label: "Absent",
    description: "No attendance recorded",
    icon: Users,
    iconClass: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
];

function AttendanceSummary({ summary }) {
  return (
    <section
      aria-label="Attendance summary"
      className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.key}
            className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur-xl sm:p-5"
          >
            <div
              className={`flex size-10 items-center justify-center rounded-xl ${card.iconClass}`}
            >
              <Icon className="size-5" />
            </div>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
              {card.label}
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {summary?.[card.key] ?? "—"}
            </p>

            <p className="mt-2 text-[11px] text-muted-foreground">
              {card.description}
            </p>
          </div>
        );
      })}
    </section>
  );
}

export default AttendanceSummary;