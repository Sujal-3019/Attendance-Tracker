import {
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CalendarX2,
} from "lucide-react";

function LeaveStats({ stats }) {
  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl border border-border/60 bg-card/55"
          />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total requests",
      value: stats.total,
      description: "All leave requests",
      icon: CalendarDays,
    },
    {
      label: "Pending",
      value: stats.pending,
      description: "Awaiting review",
      icon: CalendarClock,
    },
    {
      label: "Approved",
      value: stats.approved,
      description: `${stats.totalDaysApproved} approved days`,
      icon: CalendarCheck2,
    },
    {
      label: "Rejected",
      value: stats.rejected,
      description: "Requests declined",
      icon: CalendarX2,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-2xl border border-border/60 bg-card/55 p-5 shadow-sm backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </p>

                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {card.value}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {card.description}
                </p>
              </div>

              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <Icon className="size-4.5 text-foreground" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default LeaveStats;