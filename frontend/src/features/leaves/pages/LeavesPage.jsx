import { useEffect, useMemo, useState } from "react";

import AppShell from "@/app/layouts/AppShell";

import LeaveFilters from "../components/LeaveFilters";
import LeaveHeader from "../components/LeaveHeader";
import LeaveStats from "../components/LeaveStats";
import { getLeaveBalances, getLeaveRequests, getLeaveStats } from "../services/leaveService";
import LeaveRequestDialog from "../components/LeaveRequestDialog";
import LeaveBalanceTable from "../components/LeaveBalanceTable";
import LeavePolicies from "../components/LeavePolicies";
import { getLeavePolicies } from "../services/leavePolicyService";


function LeavesPage() {
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [balances, setBalances] = useState([]);
    const [policies, setPolicies] = useState([]);

    const [search, setSearch] = useState("");
    const [department, setDepartment] = useState("");
    const [leaveType, setLeaveType] = useState("");
    const [status, setStatus] = useState("");

    async function loadPolicies() {
        const policyData = await getLeavePolicies();
        setPolicies(policyData);
    }

    async function handlePoliciesChanged() {
        const policyData = await getLeavePolicies();
        setPolicies(policyData);
    }

    useEffect(() => {
        let mounted = true;

        async function loadLeaves() {
            setLoading(true);

            try {
                const [
                    requestsData,
                    statsData,
                    balancesData,
                ] = await Promise.all([
                    getLeaveRequests(),
                    getLeaveStats(),
                    getLeaveBalances(),
                ]);

                if (mounted) {
                    setRequests(requestsData);
                    setStats(statsData);
                    setBalances(balancesData);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadLeaves();

        return () => {
            mounted = false;
        };
    }, []);

    const filteredRequests = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return requests.filter((request) => {
            const matchesSearch =
                !normalizedSearch ||
                request.employeeName.toLowerCase().includes(normalizedSearch) ||
                request.employeeEmail.toLowerCase().includes(normalizedSearch) ||
                request.employeeId.toLowerCase().includes(normalizedSearch);

            const matchesDepartment =
                !department || request.department === department;

            const matchesLeaveType =
                !leaveType || request.leaveType === leaveType;

            const matchesStatus = !status || request.status === status;

            return (
                matchesSearch &&
                matchesDepartment &&
                matchesLeaveType &&
                matchesStatus
            );
        });
    }, [requests, search, department, leaveType, status]);

    async function handleRequestUpdated(updatedRequest) {
        setRequests((currentRequests) =>
            currentRequests.map((request) =>
                request.id === updatedRequest.id
                    ? updatedRequest
                    : request,
            ),
        );

        const [updatedStats, updatedBalances] = await Promise.all([
            getLeaveStats(),
            getLeaveBalances(),
        ]);

        setStats(updatedStats);
        setBalances(updatedBalances);
    }

    return (
        <AppShell>
            <div className="space-y-8">
                <LeaveHeader />

                <LeaveStats stats={stats} />

                <LeaveFilters
                    search={search}
                    setSearch={setSearch}
                    department={department}
                    setDepartment={setDepartment}
                    leaveType={leaveType}
                    setLeaveType={setLeaveType}
                    status={status}
                    setStatus={setStatus}
                />

                <div className="rounded-2xl border border-border/60 bg-card/55 p-5 shadow-sm backdrop-blur-xl">
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="h-16 animate-pulse rounded-xl bg-muted/60"
                                />
                            ))}
                        </div>
                    ) : (
                        <div>
                            <div className="mb-4 flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-sm font-semibold">
                                        Leave requests
                                    </h2>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {filteredRequests.length} request
                                        {filteredRequests.length === 1 ? "" : "s"} found
                                    </p>
                                </div>
                            </div>

                            {filteredRequests.length === 0 ? (
                                <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border/70">
                                    <div className="text-center">
                                        <p className="text-sm font-medium">
                                            No leave requests found
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Try changing your search or filters.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-250 text-left">
                                        <thead>
                                            <tr className="border-b border-border/60 text-xs text-muted-foreground">
                                                <th className="px-4 py-3 font-medium">
                                                    Employee
                                                </th>

                                                <th className="px-4 py-3 font-medium">
                                                    Leave type
                                                </th>

                                                <th className="px-4 py-3 font-medium">
                                                    Duration
                                                </th>

                                                <th className="px-4 py-3 font-medium">
                                                    Days
                                                </th>

                                                <th className="px-4 py-3 font-medium">
                                                    Applied on
                                                </th>

                                                <th className="px-4 py-3 font-medium">
                                                    Status
                                                </th>

                                                <th className="px-4 py-3 text-right font-medium">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredRequests.map((request) => (
                                                <tr
                                                    key={request.id}
                                                    className="border-b border-border/40 last:border-0"
                                                >
                                                    <td className="px-4 py-4">
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                {request.employeeName}
                                                            </p>

                                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                                {request.department}
                                                            </p>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4 text-sm">
                                                        {request.leaveType}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm">
                                                        {request.startDate}{" "}
                                                        <span className="text-muted-foreground">
                                                            →
                                                        </span>{" "}
                                                        {request.endDate}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm">
                                                        {request.days}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm text-muted-foreground">
                                                        {request.appliedOn}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <LeaveStatusBadge status={request.status} />
                                                    </td>

                                                    <td className="px-4 py-4 text-right">
                                                        <LeaveRequestDialog
                                                            request={request}
                                                            onUpdated={handleRequestUpdated}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Leave Balances */}
                <LeaveBalanceTable balances={balances} />
                <LeavePolicies policies={policies} onPoliciesChanged={handlePoliciesChanged} />
            </div>
        </AppShell>
    );
}

function LeaveStatusBadge({ status }) {
    const styles = {
        Pending:
            "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
        Approved:
            "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        Rejected:
            "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
    };

    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status] ?? "border-border bg-muted text-muted-foreground"
                }`}
        >
            {status}
        </span>
    );
}

export default LeavesPage;