import { Search, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";

function LeaveBalances({ balances }) {
  const [search, setSearch] = useState("");

  const filteredBalances = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return balances;
    }

    return balances.filter(
      (employee) =>
        employee.employeeName.toLowerCase().includes(normalizedSearch) ||
        employee.employeeId.toLowerCase().includes(normalizedSearch),
    );
  }, [balances, search]);

  return (
    <section className="rounded-2xl border border-border/60 bg-card/55 shadow-sm backdrop-blur-xl">
      <div className="border-b border-border/60 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <WalletCards className="size-4" />

              <h2 className="text-sm font-semibold">
                Leave balances
              </h2>
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Track allocated, used, and remaining leave for each employee.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee..."
              className="h-9 rounded-xl pl-9"
            />
          </div>
        </div>
      </div>

      {filteredBalances.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center p-6">
          <div className="text-center">
            <p className="text-sm font-medium">
              No employees found
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Try a different employee name or ID.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-212.5 text-left">
            <thead>
              <tr className="border-b border-border/60 text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">
                  Employee
                </th>

                <th className="px-5 py-3 font-medium">
                  Casual Leave
                </th>

                <th className="px-5 py-3 font-medium">
                  Sick Leave
                </th>

                <th className="px-5 py-3 font-medium">
                  Earned Leave
                </th>

                <th className="px-5 py-3 font-medium">
                  Total remaining
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredBalances.map((employee) => {
                const totalRemaining =
                  employee.casual.remaining +
                  employee.sick.remaining +
                  employee.earned.remaining;

                return (
                  <tr
                    key={employee.employeeId}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-medium">
                          {employee.employeeName}
                        </p>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {employee.employeeId}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <BalanceCell balance={employee.casual} />
                    </td>

                    <td className="px-5 py-4">
                      <BalanceCell balance={employee.sick} />
                    </td>

                    <td className="px-5 py-4">
                      <BalanceCell balance={employee.earned} />
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
                        {totalRemaining} days
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function BalanceCell({ balance }) {
  const percentage =
    balance.allocated > 0
      ? Math.min((balance.used / balance.allocated) * 100, 100)
      : 0;

  return (
    <div className="min-w-36">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">
          {balance.remaining} remaining
        </span>

        <span className="text-[11px] text-muted-foreground">
          {balance.used}/{balance.allocated}
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-1 text-[10px] text-muted-foreground">
        {balance.used} used · {balance.allocated} allocated
      </p>
    </div>
  );
}

export default LeaveBalances;