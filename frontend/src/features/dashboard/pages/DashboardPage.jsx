import { useEffect, useState } from "react";

import AppShell from "@/app/layouts/AppShell";
import DashboardHeader from "../components/DashboardHeader";
import DashboardStatCard from "../components/DashboardStatCard";
import { 
    getDashboardStats , 
    getRecentAttendance,
    getAttendanceChart,
} from "../services/dashboardService";
import AttendanceOverview from "../components/AttendanceOverview";
import RecentAttendance from "../components/RecentAttendance";

function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [recentAttendance, setRecentAttendance] = useState([]);
    const [attendanceChart, setAttendanceChart] = useState([]);
    const [loadError, setLoadError] = useState("");
    useEffect(() => {
        let mounted = true;

        async function loadDashboard() {
            try {
                const [dashboardData, recentData, chartData] = await Promise.all([
                    getDashboardStats(),
                    getRecentAttendance(),
                    getAttendanceChart(),
                ]);

                if (mounted) {
                    setStats(dashboardData);
                    setRecentAttendance(recentData);
                    setAttendanceChart(chartData);
                }
            } catch (error) {
                if (mounted) {
                    setLoadError(error.message);
                }
            }
        }

        loadDashboard();

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <AppShell>
            <div className="space-y-8">
                <DashboardHeader />
                {loadError && (
                    <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                        {loadError}
                    </p>
                )}

                <section
                    aria-label="Attendance statistics"
                    className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4"
                >
                    <DashboardStatCard
                        label="Total employees"
                        value={stats?.totalEmployees ?? "—"}
                        description="Active employees"
                    />

                    <DashboardStatCard
                        label="Present today"
                        value={stats?.presentToday ?? "—"}
                        description="Employees checked in"
                    />

                    <DashboardStatCard
                        label="Late today"
                        value={stats?.lateToday ?? "—"}
                        description="After grace period"
                    />

                    <DashboardStatCard
                        label="On leave"
                        value={stats?.onLeaveToday ?? "—"}
                        description="Approved leave today"
                    />
                </section>
                <AttendanceOverview data={attendanceChart} />
                <RecentAttendance records={recentAttendance} />
            </div>
        </AppShell>
    );
}

export default DashboardPage;