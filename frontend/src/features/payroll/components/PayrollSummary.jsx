import {
  Banknote,
  CircleDollarSign,
  Clock3,
  Users,
} from "lucide-react";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function PayrollSummary({ summary, loading = false }) {
  const cards = [
    {
      title: "Total payroll",
      value: formatCurrency(summary?.totalPayroll ?? 0),
      description: "Net payable this period",
      icon: Banknote,
    },
    {
      title: "Gross payroll",
      value: formatCurrency(summary?.totalGross ?? 0),
      description: "Before deductions",
      icon: CircleDollarSign,
    },
    {
      title: "Overtime",
      value: formatCurrency(summary?.totalOvertime ?? 0),
      description: "Additional earnings",
      icon: Clock3,
    },
    {
      title: "Employees",
      value: summary?.totalEmployees ?? 0,
      description: "Included in payroll",
      icon: Users,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border bg-background/80 p-5 shadow-sm"
          >
            <div className="animate-pulse space-y-4">
              <div className="h-9 w-9 rounded-lg bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-7 w-28 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-2xl border bg-background/80 p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-4 text-muted-foreground" />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                {card.title}
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {card.value}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PayrollSummary;