import {
  BriefcaseBusiness,
  CircleCheck,
  CircleOff,
  Users,
} from "lucide-react";

const cards = [
  {
    key: "total",
    label: "Total employees",
    icon: Users,
  },
  {
    key: "active",
    label: "Active employees",
    icon: CircleCheck,
  },
  {
    key: "inactive",
    label: "Inactive employees",
    icon: CircleOff,
  },
  {
    key: "onLeave",
    label: "On leave today",
    icon: BriefcaseBusiness,
  },
];

function EmployeeStats({ stats }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.key}
            className="h-28 animate-pulse rounded-2xl border border-border/60 bg-card/40"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.key}
            className="rounded-2xl border border-border/60 bg-card/55 p-5 shadow-sm backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </p>

                <p className="mt-3 text-2xl font-semibold tracking-tight">
                  {stats[card.key]}
                </p>
              </div>

              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/80">
                <Icon className="size-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default EmployeeStats;