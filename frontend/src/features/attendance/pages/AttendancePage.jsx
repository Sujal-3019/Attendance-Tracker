import { useEffect, useState } from "react";
import {
  AlertCircle,
  Clock3,
  MapPin,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import AppShell from "@/app/layouts/AppShell";
import { Button } from "@/components/ui/button";

import AttendanceHeader from "../components/AttendanceHeader";
import AttendanceSummary from "../components/AttendanceSummary";
import AttendanceTable from "../components/AttendanceTable";
import AttendanceCorrectionDialog from "../components/AttendanceCorrectionDialog";
import AttendanceCorrectionTable from "../components/AttendanceCorrectionTable";
import ForgotCheckoutDialog from "../components/ForgotCheckoutDialog";

import { getCorrectionRequests } from "../services/attendanceCorrectionService";
import {
  getForgotCheckoutRecords,
} from "../services/forgotCheckoutService";
import {
  getAttendanceRecords,
  getAttendanceSummary,
} from "../services/attendanceService";

function AttendancePage() {
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);

  const [correctionRequests, setCorrectionRequests] = useState([]);
  const [correctionLoading, setCorrectionLoading] =
    useState(true);
  const [selectedCorrection, setSelectedCorrection] =
    useState(null);
  const [correctionDialogOpen, setCorrectionDialogOpen] =
    useState(false);

  const [forgotCheckoutRecords, setForgotCheckoutRecords] =
    useState([]);
  const [forgotCheckoutLoading, setForgotCheckoutLoading] =
    useState(true);
  const [selectedForgotCheckout, setSelectedForgotCheckout] =
    useState(null);
  const [
    forgotCheckoutDialogOpen,
    setForgotCheckoutDialogOpen,
  ] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

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

  useEffect(() => {
    async function loadCorrectionRequests() {
      try {
        setCorrectionLoading(true);

        const data = await getCorrectionRequests();

        setCorrectionRequests(data);
      } catch {
        setCorrectionRequests([]);
      } finally {
        setCorrectionLoading(false);
      }
    }

    loadCorrectionRequests();
  }, []);

  useEffect(() => {
    async function loadForgotCheckoutRecords() {
      try {
        setForgotCheckoutLoading(true);

        const data = await getForgotCheckoutRecords();

        setForgotCheckoutRecords(data);
      } catch {
        setForgotCheckoutRecords([]);
      } finally {
        setForgotCheckoutLoading(false);
      }
    }

    loadForgotCheckoutRecords();
  }, []);

  useEffect(() => {
    const correctionId = searchParams.get("correction");

    if (!correctionId || correctionRequests.length === 0) {
      return;
    }

    const request = correctionRequests.find(
      (item) => item.id === correctionId,
    );

    if (!request) {
      return;
    }

    setSelectedCorrection(request);
    setCorrectionDialogOpen(true);

    setSearchParams({}, { replace: true });
  }, [
    searchParams,
    correctionRequests,
    setSearchParams,
  ]);

  useEffect(() => {
    const forgotCheckoutId =
      searchParams.get("forgotCheckout");

    if (
      !forgotCheckoutId ||
      forgotCheckoutRecords.length === 0
    ) {
      return;
    }

    const record = forgotCheckoutRecords.find(
      (item) => item.id === forgotCheckoutId,
    );

    if (!record) {
      return;
    }

    setSelectedForgotCheckout(record);
    setForgotCheckoutDialogOpen(true);

    setSearchParams({}, { replace: true });
  }, [
    searchParams,
    forgotCheckoutRecords,
    setSearchParams,
  ]);

  function handleReviewCorrection(request) {
    setSelectedCorrection(request);
    setCorrectionDialogOpen(true);
  }

  function handleReviewForgotCheckout(record) {
    setSelectedForgotCheckout(record);
    setForgotCheckoutDialogOpen(true);
  }

  function handleForgotCheckoutUpdated(updatedRecord) {
    setForgotCheckoutRecords((currentRecords) =>
      currentRecords.map((record) =>
        record.id === updatedRecord.id
          ? updatedRecord
          : record,
      ),
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <AttendanceHeader />

        <AttendanceSummary summary={summary} />

        <AttendanceTable records={records} />

        <AttendanceCorrectionTable
          requests={correctionRequests}
          loading={correctionLoading}
          onReview={handleReviewCorrection}
        />

        {/* Forgot checkout */}
        <section className="overflow-hidden rounded-2xl border bg-background/80 shadow-sm">
          <div className="border-b px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Clock3 className="size-4 text-muted-foreground" />

                  <h2 className="text-base font-semibold">
                    Forgot checkout
                  </h2>
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Review employees who have not checked out
                  after their scheduled end time.
                </p>
              </div>

              {forgotCheckoutRecords.length > 0 && (
                <span className="w-fit rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                  {forgotCheckoutRecords.length} pending
                </span>
              )}
            </div>
          </div>

          {forgotCheckoutLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-xl border p-4"
                >
                  <div className="space-y-3">
                    <div className="h-4 w-1/3 rounded bg-muted" />
                    <div className="h-3 w-2/3 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : forgotCheckoutRecords.length === 0 ? (
            <div className="px-5 py-10 text-center sm:px-6">
              <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-muted">
                <Clock3 className="size-5 text-muted-foreground" />
              </div>

              <p className="mt-3 text-sm font-medium">
                No forgotten checkouts
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                All employees have completed their checkout
                or there are no records requiring review.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20 text-left">
                      <th className="px-5 py-3 font-medium text-muted-foreground">
                        Employee
                      </th>

                      <th className="px-5 py-3 font-medium text-muted-foreground">
                        Date
                      </th>

                      <th className="px-5 py-3 font-medium text-muted-foreground">
                        Check-in
                      </th>

                      <th className="px-5 py-3 font-medium text-muted-foreground">
                        Scheduled checkout
                      </th>

                      <th className="px-5 py-3 font-medium text-muted-foreground">
                        Location
                      </th>

                      <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {forgotCheckoutRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="transition-colors hover:bg-muted/20"
                      >
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-medium">
                              {record.employeeName}
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {record.employeeCode} ·{" "}
                              {record.department}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-muted-foreground">
                          {record.attendanceDate}
                        </td>

                        <td className="px-5 py-4">
                          {record.checkIn}
                        </td>

                        <td className="px-5 py-4">
                          <div>
                            <p className="font-medium">
                              {record.scheduledEndTime}
                            </p>

                            <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                              Checkout missing
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="size-3.5 text-muted-foreground" />

                            <div>
                              <p className="text-sm">
                                {record.locationName}
                              </p>

                              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                {record.locationStatus}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleReviewForgotCheckout(
                                record,
                              )
                            }
                          >
                            Review
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y md:hidden">
                {forgotCheckoutRecords.map((record) => (
                  <div
                    key={record.id}
                    className="space-y-4 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {record.employeeName}
                        </p>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {record.employeeCode} ·{" "}
                          {record.department}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                        Checkout missing
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-[11px] text-muted-foreground">
                          Date
                        </p>

                        <p className="mt-1 text-xs font-medium">
                          {record.attendanceDate}
                        </p>
                      </div>

                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-[11px] text-muted-foreground">
                          Check-in
                        </p>

                        <p className="mt-1 text-xs font-medium">
                          {record.checkIn}
                        </p>
                      </div>

                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-[11px] text-muted-foreground">
                          Scheduled end
                        </p>

                        <p className="mt-1 text-xs font-medium">
                          {record.scheduledEndTime}
                        </p>
                      </div>

                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-[11px] text-muted-foreground">
                          Overtime
                        </p>

                        <p className="mt-1 text-xs font-medium">
                          {record.overtimeEnabled
                            ? "Enabled"
                            : "Disabled"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" />

                      <span>
                        {record.locationName} ·{" "}
                        {record.locationStatus}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        handleReviewForgotCheckout(record)
                      }
                    >
                      Review checkout
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <AttendanceCorrectionDialog
          request={selectedCorrection}
          open={correctionDialogOpen}
          onOpenChange={setCorrectionDialogOpen}
          onUpdated={(updatedRequest) => {
            setCorrectionRequests((currentRequests) =>
              currentRequests.map((request) =>
                request.id === updatedRequest.id
                  ? updatedRequest
                  : request,
              ),
            );
          }}
        />

        <ForgotCheckoutDialog
          record={selectedForgotCheckout}
          open={forgotCheckoutDialogOpen}
          onOpenChange={setForgotCheckoutDialogOpen}
          onUpdated={handleForgotCheckoutUpdated}
        />
      </div>
    </AppShell>
  );
}

export default AttendancePage;