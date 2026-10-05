import { AlertTriangle, CheckCircle2, Clock3, UserRound, XCircle } from "lucide-react";
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

import {
  approveCorrection,
  rejectCorrection,
} from "../services/attendanceCorrectionService";

function AttendanceCorrectionDialog({
  request,
  open,
  onOpenChange,
  onUpdated,
}) {
  const [reviewReason, setReviewReason] = useState("");
  const [processingAction, setProcessingAction] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setReviewReason("");
      setProcessingAction("");
      setError("");
    }
  }, [open]);

  if (!request) {
    return null;
  }

  const isPending = request.status === "Pending";

  async function handleApprove() {
    try {
      setProcessingAction("approve");
      setError("");

      const updatedRequest = await approveCorrection(
        request.id,
        reviewReason,
      );

      onUpdated?.(updatedRequest);
      onOpenChange(false);
    } catch (actionError) {
      setError(
        actionError.message ||
          "Unable to approve the correction request.",
      );
    } finally {
      setProcessingAction("");
    }
  }

  async function handleReject() {
    if (!reviewReason.trim()) {
      setError("Please provide a reason before rejecting the request.");
      return;
    }

    try {
      setProcessingAction("reject");
      setError("");

      const updatedRequest = await rejectCorrection(
        request.id,
        reviewReason,
      );

      onUpdated?.(updatedRequest);
      onOpenChange(false);
    } catch (actionError) {
      setError(
        actionError.message ||
          "Unable to reject the correction request.",
      );
    } finally {
      setProcessingAction("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review attendance correction</DialogTitle>
          <DialogDescription>
            Review the original attendance record and the employee's
            requested changes before making a decision.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Employee */}
          <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
              {request.employeeName
                .split(" ")
                .map((name) => name[0])
                .join("")
                .slice(0, 2)}
            </div>

            <div className="min-w-0">
              <p className="font-medium">{request.employeeName}</p>
              <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                <span>{request.employeeCode}</span>
                <span>•</span>
                <span>{request.department}</span>
              </div>
            </div>

            <div className="ml-auto">
              <span
                className={[
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                  request.status === "Pending"
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : request.status === "Approved"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-red-500/10 text-red-700 dark:text-red-400",
                ].join(" ")}
              >
                {request.status}
              </span>
            </div>
          </div>

          {/* Attendance comparison */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Clock3 className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">
                Attendance comparison
              </h3>
            </div>

            <div className="overflow-hidden rounded-xl border">
              <div className="grid grid-cols-3 border-b bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground">
                <span>Time</span>
                <span>Original</span>
                <span>Requested</span>
              </div>

              <div className="grid grid-cols-3 border-b px-4 py-3 text-sm">
                <span className="font-medium">Check-in</span>
                <span>{request.originalCheckIn || "—"}</span>
                <span className="font-medium text-primary">
                  {request.requestedCheckIn || "—"}
                </span>
              </div>

              <div className="grid grid-cols-3 px-4 py-3 text-sm">
                <span className="font-medium">Check-out</span>
                <span>{request.originalCheckOut || "—"}</span>
                <span className="font-medium text-primary">
                  {request.requestedCheckOut || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Request details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <UserRound className="size-3.5" />
                Attendance date
              </div>
              <p className="mt-2 text-sm font-medium">
                {request.attendanceDate}
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Clock3 className="size-3.5" />
                Submitted
              </div>
              <p className="mt-2 text-sm font-medium">
                {new Date(request.submittedAt).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Employee's reason
            </p>
            <p className="mt-2 text-sm leading-6">
              {request.reason}
            </p>
          </div>

          {request.status !== "Pending" && request.reviewReason && (
            <div
              className={[
                "rounded-xl border p-4",
                request.status === "Approved"
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-red-500/20 bg-red-500/5",
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                {request.status === "Approved" ? (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                ) : (
                  <XCircle className="size-4 text-red-600" />
                )}

                <p className="text-xs font-medium">
                  Admin review
                </p>
              </div>

              <p className="mt-2 text-sm leading-6">
                {request.reviewReason}
              </p>

              {request.reviewedBy && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Reviewed by {request.reviewedBy}
                  {request.reviewedAt
                    ? ` • ${new Date(
                        request.reviewedAt,
                      ).toLocaleString("en-IN")}`
                    : ""}
                </p>
              )}
            </div>
          )}

          {isPending && (
            <div className="space-y-2">
              <label
                htmlFor="correction-review-reason"
                className="text-sm font-medium"
              >
                Review note
                <span className="ml-1 text-muted-foreground">
                  (required for rejection)
                </span>
              </label>

              <Textarea
                id="correction-review-reason"
                value={reviewReason}
                onChange={(event) => setReviewReason(event.target.value)}
                placeholder="Add a note about your decision..."
                rows={3}
                maxLength={500}
              />

              <p className="text-right text-xs text-muted-foreground">
                {reviewReason.length}/500
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={Boolean(processingAction)}
          >
            Close
          </Button>

          {isPending && (
            <>
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={Boolean(processingAction)}
              >
                <XCircle className="size-4" />
                {processingAction === "reject"
                  ? "Rejecting..."
                  : "Reject"}
              </Button>

              <Button
                onClick={handleApprove}
                disabled={Boolean(processingAction)}
              >
                <CheckCircle2 className="size-4" />
                {processingAction === "approve"
                  ? "Approving..."
                  : "Approve"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AttendanceCorrectionDialog;