import { useEffect, useState } from "react";

import AppShell from "@/app/layouts/AppShell";

import AttendanceHeader from "../components/AttendanceHeader";
import AttendanceSummary from "../components/AttendanceSummary";
import AttendanceTable from "../components/AttendanceTable";
import {
  getAttendanceRecords,
  getAttendanceSummary,
} from "../services/attendanceService";

function AttendancePage() {
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadAttendance() {
      const [summaryData, recordsData] = await Promise.all([
        getAttendanceSummary(),
        getAttendanceRecords(),
      ]);

      if (mounted) {
        setSummary(summaryData);
        setRecords(recordsData);
      }
    }

    loadAttendance();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppShell>
      <div className="space-y-8">
        <AttendanceHeader />

        <AttendanceSummary summary={summary} />

        <AttendanceTable records={records} />
      </div>
    </AppShell>
  );
}

export default AttendancePage;