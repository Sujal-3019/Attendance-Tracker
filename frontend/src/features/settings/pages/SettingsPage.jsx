import AppShell from "@/app/layouts/AppShell";

import OrganizationSettings from "../components/OrganizationSettings";
import SettingsHeader from "../components/SettingsHeader";
import AttendancePolicy from "../components/AttendancePolicy";
import WorkLocations from "../components/WorkLocations";
import PayrollSettings from "../components/PayrollSettings";

function SettingsPage() {
    return (
        <AppShell>
            <div className="space-y-8">
                <SettingsHeader />

                <div className="max-w-5xl">
                    <OrganizationSettings />
                    <br />
                    <AttendancePolicy />
                    <br />
                    <WorkLocations />
                    <br />
                    <PayrollSettings />
                </div>
            </div>
        </AppShell>
    );
}

export default SettingsPage;