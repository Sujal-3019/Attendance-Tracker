import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const attendanceData = [
  { day: "Mon", present: 24, late: 3, leave: 2, absent: 3 },
  { day: "Tue", present: 26, late: 2, leave: 1, absent: 3 },
  { day: "Wed", present: 25, late: 4, leave: 2, absent: 1 },
  { day: "Thu", present: 27, late: 2, leave: 1, absent: 2 },
  { day: "Fri", present: 23, late: 5, leave: 2, absent: 2 },
  { day: "Sat", present: 18, late: 2, leave: 4, absent: 8 },
  { day: "Sun", present: 0, late: 0, leave: 0, absent: 32 },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5 shadow-lg">
      <p className="mb-2 text-xs font-semibold">{label}</p>

      <div className="space-y-1">
        {payload.map((item) => (
          <div
            key={item.dataKey}
            className="flex items-center justify-between gap-6 text-[11px]"
          >
            <span className="text-muted-foreground">{item.name}</span>
            <span className="font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttendanceOverview() {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur-xl sm:p-5 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Attendance overview
          </h2>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Workforce attendance for the current week.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
          <LegendItem label="Present" />
          <LegendItem label="Late" />
          <LegendItem label="Leave" />
          <LegendItem label="Absent" />
        </div>
      </div>

      <div className="mt-6 h-70 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={attendanceData}
            margin={{
              top: 8,
              right: 4,
              left: -20,
              bottom: 0,
            }}
            barGap={4}
          >
            <CartesianGrid
              vertical={false}
              stroke="currentColor"
              strokeOpacity={0.08}
            />

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 11,
                fill: "currentColor",
                opacity: 0.55,
              }}
            />

            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 11,
                fill: "currentColor",
                opacity: 0.55,
              }}
            />

            <Tooltip
              cursor={{ fill: "currentColor", opacity: 0.04 }}
              content={<CustomTooltip />}
            />

            <Bar
              dataKey="present"
              name="Present"
              stackId="attendance"
              fill="var(--chart-1)"
              radius={[0, 0, 0, 0]}
            />

            <Bar
              dataKey="late"
              name="Late"
              stackId="attendance"
              fill="var(--chart-2)"
            />

            <Bar
              dataKey="leave"
              name="Leave"
              stackId="attendance"
              fill="var(--chart-3)"
            />

            <Bar
              dataKey="absent"
              name="Absent"
              stackId="attendance"
              fill="var(--chart-5)"
              radius={[5, 5, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function LegendItem({ label }) {
  const chartVariable = {
    Present: "var(--chart-1)",
    Late: "var(--chart-2)",
    Leave: "var(--chart-3)",
    Absent: "var(--chart-5)",
  };

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: chartVariable[label] }}
      />
      <span>{label}</span>
    </div>
  );
}

export default AttendanceOverview;