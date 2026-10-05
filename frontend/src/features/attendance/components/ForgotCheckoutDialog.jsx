import {
  AlertCircle,
  Clock3,
  MapPin,
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
import { Textarea } from "@/components/ui/textarea";

import { resolveForgotCheckout } from "../services/forgotCheckoutService";

function ForgotCheckoutDialog({
  open,
  onOpenChange,
  record,
  onUpdated,
}) {
  const [decision, setDecision] = useState("MARK_CHECKOUT");
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !record) {
      return;
    }

    setDecision("MARK_CHECKOUT");
    setAdminNote("");
    setError("");
  }, [open, record]);

  if (!record) {
    return null;
  }

  const isResolved = record.currentStatus !== "Checked In";

  async function handleSubmit() {
    setError("");

    if (
      decision !== "KEEP_PENDING" &&
      !adminNote.trim()
    ) {
      setError(
        "Please add an admin note before resolving this attendance record.",
      );
      return;
    }

    try {
      setSubmitting(true);

      const updatedRecord = await resolveForgotCheckout(
        record.id,
        decision,
        adminNote,
      );

      onUpdated?.(updatedRecord);
      onOpenChange(false);
    } catch (submissionError) {
      setError(
        submissionError?.message ||
          "Unable to resolve the forgot checkout record.",
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
            Forgot checkout review
          </DialogTitle>

          <DialogDescription>
            Review the attendance record and decide how the
            missing checkout should be handled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Employee */}
          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserRound className="size-5" />
              </div>

              <div className="min-w-0">
                <p className="font-semibold">
                  {record.employeeName}
                </p>

                <p className="mt-0.5 text-sm text-muted-foreground">
                  {record.employeeCode} · {record.department}
                </p>
              </div>
            </div>
          </div>

          {/* Attendance details */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Clock3 className="size-4 text-muted-foreground" />
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
                  {record.attendanceDate}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Current status
                </p>

                <p className="mt-1 text-sm font-medium">
                  {record.currentStatus}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Check-in
                </p>

                <p className="mt-1 text-sm font-medium">
                  {record.checkIn}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Scheduled checkout
                </p>

                <p className="mt-1 text-sm font-medium">
                  {record.scheduledEndTime}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Actual checkout
                </p>

                <p className="mt-1 text-sm font-medium">
                  {record.checkOut || "Not recorded"}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Overtime
                </p>

                <p className="mt-1 text-sm font-medium">
                  {record.overtimeEnabled
                    ? `Enabled · after ${record.overtimeAfterMinutes} min`
                    : "Disabled"}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

              <div>
                <p className="text-sm font-medium">
                  Attendance location
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {record.locationName}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Status: {record.locationStatus}
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          {!isResolved && (
            <div className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />

              <div>
                <p className="text-sm font-medium">
                  Checkout is missing
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  The employee has not recorded a checkout
                  after the scheduled end time. Review the
                  record before deciding whether to close the
                  attendance or treat the remaining time as
                  overtime.
                </p>
              </div>
            </div>
          )}

          {/* Decision */}
          {!isResolved ? (
            <div>
              <h3 className="mb-3 text-sm font-semibold">
                Resolution
              </h3>

              <div className="space-y-2">
                <label
                  className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                    decision === "MARK_CHECKOUT"
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="forgot-checkout-decision"
                    value="MARK_CHECKOUT"
                    checked={
                      decision === "MARK_CHECKOUT"
                    }
                    onChange={(event) =>
                      setDecision(event.target.value)
                    }
                    className="mt-1"
                  />

                  <div>
                    <p className="text-sm font-medium">
                      Mark as checked out
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Close the attendance using the scheduled
                      checkout time of{" "}
                      {record.scheduledEndTime}.
                    </p>
                  </div>
                </label>

                {record.overtimeEnabled && (
                  <label
                    className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                      decision === "MARK_OVERTIME"
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="forgot-checkout-decision"
                      value="MARK_OVERTIME"
                      checked={
                        decision === "MARK_OVERTIME"
                      }
                      onChange={(event) =>
                        setDecision(event.target.value)
                      }
                      className="mt-1"
                    />

                    <div>
                      <p className="text-sm font-medium">
                        Mark for overtime review
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Keep the checkout unresolved and flag
                        the record for overtime handling.
                      </p>
                    </div>
                  </label>
                )}

                <label
                  className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                    decision === "KEEP_PENDING"
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="forgot-checkout-decision"
                    value="KEEP_PENDING"
                    checked={
                      decision === "KEEP_PENDING"
                    }
                    onChange={(event) =>
                      setDecision(event.target.value)
                    }
                    className="mt-1"
                  />

                  <div>
                    <p className="text-sm font-medium">
                      Keep pending
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Leave the attendance record unchanged
                      until more information is available.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-sm font-medium">
                Resolution already recorded
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Decision:{" "}
                {record.overtimeDecision ||
                  "Not specified"}
              </p>

              {record.adminNote && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Note: {record.adminNote}
                </p>
              )}
            </div>
          )}

          {/* Admin note */}
          {!isResolved && decision !== "KEEP_PENDING" && (
            <div>
              <label
                htmlFor="forgot-checkout-admin-note"
                className="mb-2 block text-sm font-medium"
              >
                Admin note
              </label>

              <Textarea
                id="forgot-checkout-admin-note"
                value={adminNote}
                onChange={(event) =>
                  setAdminNote(event.target.value)
                }
                placeholder="Explain why this attendance record is being resolved..."
                rows={4}
                maxLength={500}
              />

              <p className="mt-1 text-right text-xs text-muted-foreground">
                {adminNote.length}/500
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {error}
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

          {!isResolved && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : decision === "MARK_CHECKOUT"
                  ? "Mark checked out"
                  : decision === "MARK_OVERTIME"
                    ? "Mark for overtime"
                    : "Keep pending"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ForgotCheckoutDialog;