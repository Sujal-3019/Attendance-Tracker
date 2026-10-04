import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

function LeaveBalanceTable({ balances }) {
    const [search, setSearch] = useState("");

    const filteredBalances = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        if (!normalizedSearch) {
            return balances;
        }

        return balances.filter(
            (employee) =>
                employee.employeeName
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                employee.employeeId
                    .toLowerCase()
                    .includes(normalizedSearch),
        );
    }, [balances, search]);

    return (
        <section className="rounded-2xl border border-border/60 bg-card/55 p-5 shadow-sm backdrop-blur-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-sm font-semibold">
                        Leave balances
                    </h2>

                    <p className="mt-1 text-xs text-muted-foreground">
                        Current leave allocation and usage by employee.
                    </p>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="Search employee..."
                        className="h-9 rounded-xl pl-9"
                    />
                </div>
            </div>

            <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-225 text-left">
                    <thead>
                        <tr className="border-b border-border/60 text-xs text-muted-foreground">
                            <th className="px-4 py-3 font-medium">
                                Employee
                            </th>

                            <th className="px-4 py-3 font-medium">
                                Casual leave
                            </th>

                            <th className="px-4 py-3 font-medium">
                                Sick leave
                            </th>

                            <th className="px-4 py-3 font-medium">
                                Earned leave
                            </th>

                            <th className="px-4 py-3 font-medium">
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
                                    <td className="px-4 py-4">
                                        <p className="text-sm font-medium">
                                            {employee.employeeName}
                                        </p>

                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {employee.employeeId}
                                        </p>
                                    </td>

                                    <td className="px-4 py-4">
                                        <LeaveBalanceCell
                                            balance={employee.casual}
                                        />
                                    </td>

                                    <td className="px-4 py-4">
                                        <LeaveBalanceCell
                                            balance={employee.sick}
                                        />
                                    </td>

                                    <td className="px-4 py-4">
                                        <LeaveBalanceCell
                                            balance={employee.earned}
                                        />
                                    </td>

                                    <td className="px-4 py-4">
                                        <span className="font-semibold">
                                            {totalRemaining}
                                        </span>

                                        <span className="ml-1 text-xs text-muted-foreground">
                                            days
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {filteredBalances.length === 0 && (
                <div className="mt-4 flex min-h-32 items-center justify-center rounded-xl border border-dashed border-border/70">
                    <p className="text-sm text-muted-foreground">
                        No employees found.
                    </p>
                </div>
            )}
        </section>
    );
}

function LeaveBalanceCell({ balance }) {
    const usagePercentage =
        balance.allocated > 0
            ? Math.min(
                  (balance.used / balance.allocated) * 100,
                  100,
              )
            : 0;

    return (
        <div className="min-w-32">
            <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">
                    {balance.remaining}
                </span>

                <span className="text-[11px] text-muted-foreground">
                    {balance.used}/{balance.allocated} used
                </span>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full bg-foreground transition-all"
                    style={{
                        width: `${usagePercentage}%`,
                    }}
                />
            </div>
        </div>
    );
}

export default LeaveBalanceTable;