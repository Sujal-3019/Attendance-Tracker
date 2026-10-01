import { useEffect, useState } from "react";

import AppShell from "@/app/layouts/AppShell";
import DashboardHeader from "../components/DashboardHeader";
import DashboardStatCard from "../components/DashboardStatCard";
import { 
    getDashboardStats , 
    getRecentAttendance 
} from "../services/dashboardService";
import AttendanceOverview from "../components/AttendanceOverview";
import RecentAttendance from "../components/RecentAttendance";

function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [recentAttendance, setRecentAttendance] = useState([]);
    useEffect(() => {
        let mounted = true;

        async function loadDashboard() {
            const [dashboardData, attendanceData] = await Promise.all([
                getDashboardStats(),
                getRecentAttendance(),
            ]);

            if (mounted) {
                setStats(dashboardData);
                setRecentAttendance(attendanceData);
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

                <section
                    aria-label="Attendance statistics"
                    className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4"
                >
                    <DashboardStatCard
                        label="Total employees"
                        value={stats?.totalEmployees ?? "—"}
                        description="Active employees"
                        trend={8.2}
                        trendLabel="vs last month"
                    />

                    <DashboardStatCard
                        label="Present today"
                        value={stats?.presentToday ?? "—"}
                        description="Employees checked in"
                        trend={4.5}
                        trendLabel="vs yesterday"
                    />

                    <DashboardStatCard
                        label="Late today"
                        value={stats?.lateToday ?? "—"}
                        description="After grace period"
                        trend={-12.4}
                        trendLabel="vs yesterday"
                    />

                    <DashboardStatCard
                        label="On leave"
                        value={stats?.onLeaveToday ?? "—"}
                        description="Approved leave today"
                    />
                </section>
                <AttendanceOverview />
                <RecentAttendance records={recentAttendance} />
            </div>
        </AppShell>
    );
}

export default DashboardPage;