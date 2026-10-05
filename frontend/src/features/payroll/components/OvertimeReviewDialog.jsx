import {
  AlertCircle,
  CalendarDays,
  Clock3,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  approveOvertime,
  rejectOvertime,
} from "../services/overtimeService";

function OvertimeReviewDialog({
  open,
  onOpenChange,
  request,
  onUpdated,
}) {
  const [overtimeHours, setOvertimeHours] =
    useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !request) {
      return;
    }

    setOvertimeHours(
      request.overtimeHours > 0
        ? String(request.overtimeHours)
        : request.potentialOvertimeHours > 0
          ? String(request.potentialOvertimeHours)
          : "",
    );

    setReviewNote("");
    setError("");
  }, [open, request]);

  if (!request) {
    return null;
  }

  const isPending =
    request.overtimeStatus === "Pending";

  const hasCheckout = Boolean(request.checkOut);

  async function handleApprove() {
    setError("");

    if (!overtimeHours) {
      setError("Enter the approved overtime hours.");
      return;
    }

    if (!reviewNote.trim()) {
      setError(
        "A review note is required when approving overtime.",
      );
      return;
    }

    try {
      setSubmitting(true);

      const updatedRequest = await approveOvertime(
        request.id,
        overtimeHours,
        reviewNote,
      );

      onUpdated?.(updatedRequest);
      onOpenChange(false);
    } catch (submissionError) {
      setError(
        submissionError?.message ||
          "Unable to approve overtime.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    setError("");

    if (!reviewNote.trim()) {
      setError(
        "A rejection note is required.",
      );
      return;
    }

    try {
      setSubmitting(true);

      const updatedRequest = await rejectOvertime(
        request.id,
        reviewNote,
      );

      onUpdated?.(updatedRequest);
      onOpenChange(false);
    } catch (submissionError) {
      setError(
        submissionError?.message ||
          "Unable to reject overtime.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!submitting) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Review overtime
          </DialogTitle>

          <DialogDescription>
            Review the attendance timeline and calculated
            overtime before approving it for payroll.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Employee */}
          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserRound className="size-5" />
              </div>

              <div>
                <p className="font-semibold">
                  {request.employeeName}
                </p>

                <p className="mt-0.5 text-sm text-muted-foreground">
                  {request.employeeCode} ·{" "}
                  {request.department}
                </p>
              </div>
            </div>
          </div>

          {/* Attendance */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />

              <h3 className="text-sm font-semibold">
                Attendance details
              </h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Attendance date
                </p>

                <p className="mt-1 text-sm font-medium">
                  {request.attendanceDate}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Source
                </p>

                <p className="mt-1 text-sm font-medium">
                  {request.source}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Check-in
                </p>

                <p className="mt-1 text-sm font-medium">
                  {request.checkIn}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Scheduled end
                </p>

                <p className="mt-1 text-sm font-medium">
                  {request.scheduledEndTime}
                </p>
              </div>

              <div
                className={`rounded-xl border p-4 ${
                  hasCheckout
                    ? "border-primary/20 bg-primary/5"
                    : ""
                }`}
              >
                <p className="text-xs text-muted-foreground">
                  Actual checkout
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {request.checkOut || (
                    <span className="font-medium text-muted-foreground">
                      Not recorded
                    </span>
                  )}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Current status
                </p>

                <p className="mt-1 text-sm font-medium">
                  {request.overtimeStatus}
                </p>
              </div>
            </div>
          </div>

          {/* Calculated overtime */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <Clock3 className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  Calculated overtime
                </p>

                {hasCheckout ? (
                  <>
                    <p className="mt-1 text-lg font-semibold">
                      {request.potentialOvertimeDuration}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Based on scheduled end time{" "}
                      <span className="font-medium text-foreground">
                        {request.scheduledEndTime}
                      </span>{" "}
                      and actual checkout{" "}
                      <span className="font-medium text-foreground">
                        {request.checkOut}
                      </span>
                      .
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Calculated duration:{" "}
                      {request.potentialOvertimeHours} hours
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Overtime cannot be calculated until an
                    actual checkout time is recorded.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="rounded-xl border bg-muted/20 p-4">
            <p className="text-sm font-medium">
              Reason
            </p>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {request.reason}
            </p>
          </div>

          {isPending ? (
            <>
              {/* Overtime hours */}
              <div>
                <label
                  htmlFor="overtime-hours"
                  className="mb-2 block text-sm font-medium"
                >
                  Approved overtime hours
                </label>

                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="overtime-hours"
                    type="number"
                    min="0.25"
                    max="24"
                    step="0.25"
                    value={overtimeHours}
                    onChange={(event) =>
                      setOvertimeHours(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. 1.5"
                    className="pl-9"
                  />
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  The calculated duration is provided as a
                  starting point. Adjust it if the approved
                  payroll overtime differs.
                </p>
              </div>

              {/* Review note */}
              <div>
                <label
                  htmlFor="overtime-review-note"
                  className="mb-2 block text-sm font-medium"
                >
                  Review note
                </label>

                <Textarea
                  id="overtime-review-note"
                  value={reviewNote}
                  onChange={(event) =>
                    setReviewNote(event.target.value)
                  }
                  placeholder="Explain the overtime approval or rejection..."
                  rows={4}
                  maxLength={500}
                />

                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {reviewNote.length}/500
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-sm font-medium">
                Overtime already reviewed
              </p>

              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p>
                  Status:{" "}
                  {request.overtimeStatus}
                </p>

                <p>
                  Approved hours:{" "}
                  {request.overtimeHours}h
                </p>

                <p>
                  Calculated duration:{" "}
                  {request.potentialOvertimeDuration}
                </p>

                {request.reviewNote && (
                  <p>
                    Review note:{" "}
                    {request.reviewNote}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>

          {isPending && (
            <>
              <Button
                type="button"
                variant="destructive"
                onClick={handleReject}
                disabled={submitting}
              >
                {submitting
                  ? "Saving..."
                  : "Reject overtime"}
              </Button>

              <Button
                type="button"
                onClick={handleApprove}
                disabled={submitting}
              >
                {submitting
                  ? "Saving..."
                  : "Approve overtime"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default OvertimeReviewDialog;

