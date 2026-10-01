import {
  ArrowDownRight,
  ArrowUpRight,
  Users,
} from "lucide-react";

const iconMap = {
  employees: Users,
};

function DashboardStatCard({
  label,
  value,
  description,
  icon = "employees",
  trend,
  trendLabel,
}) {
  const Icon = iconMap[icon] ?? Users;
  const isPositive = trend >= 0;

  return (
    <div className="group rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
          <Icon className="size-5" />
        </div>

        {trend !== undefined && (
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
              isPositive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}

            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>

        <p className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {value}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>{description}</span>

          {trendLabel && (
            <>
              <span aria-hidden="true">·</span>
              <span>{trendLabel}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardStatCard;