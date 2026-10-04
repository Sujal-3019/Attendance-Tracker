import {
    CalendarDays,
    Check,
    Clock3,
    FileText,
    UserRound,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import {
    approveLeave,
    rejectLeave,
} from "../services/leaveService";

function LeaveRequestDialog({ request, onUpdated }) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");

    useEffect(() => {
        if (!open) {
            setError("");
            setRejectionReason("");
        }
    }, [open]);

    const isPending = request.status === "Pending";

    async function handleApprove() {
        setError("");
        setProcessing(true);

        try {
            const updatedRequest = await approveLeave(request.id);

            onUpdated(updatedRequest);
            setOpen(false);
        } catch (approvalError) {
            setError(
                approvalError.message || "Unable to approve this request.",
            );
        } finally {
            setProcessing(false);
        }
    }

    async function handleReject() {
        if (!rejectionReason.trim()) {
            setError("Please provide a reason for rejecting this request.");
            return;
        }

        setError("");
        setProcessing(true);

        try {
            const updatedRequest = await rejectLeave(
                request.id,
                rejectionReason,
            );

            onUpdated(updatedRequest);
            setOpen(false);
        } catch (rejectionError) {
            setError(
                rejectionError.message || "Unable to reject this request.",
            );
        } finally {
            setProcessing(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg"
                    />
                }
            >
                View
            </DialogTrigger>

            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Leave request</DialogTitle>

                    <DialogDescription>
                        Review the employee's leave request before taking action.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                            <UserRound className="size-4" />
                        </div>

                        <div className="min-w-0">
                            <p className="text-sm font-semibold">
                                {request.employeeName}
                            </p>

                            <p className="truncate text-xs text-muted-foreground">
                                {request.employeeEmail}
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {request.department} · {request.employeeId}
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <DetailItem
                            icon={CalendarDays}
                            label="Leave type"
                            value={request.leaveType}
                        />

                        <DetailItem
                            icon={Clock3}
                            label="Duration"
                            value={`${request.days} ${request.days === 1 ? "day" : "days"
                                }`}
                        />

                        <DetailItem
                            icon={CalendarDays}
                            label="Start date"
                            value={request.startDate}
                        />

                        <DetailItem
                            icon={CalendarDays}
                            label="End date"
                            value={request.endDate}
                        />
                    </div>

                    <div className="rounded-xl border border-border/60 p-4">
                        <div className="flex items-center gap-2">
                            <FileText className="size-4 text-muted-foreground" />

                            <p className="text-xs font-medium text-muted-foreground">
                                Reason
                            </p>
                        </div>

                        <p className="mt-2 text-sm leading-6">
                            {request.reason}
                        </p>
                    </div>

                    {request.status === "Rejected" &&
                        request.rejectionReason && (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                                <p className="text-xs font-medium text-red-700 dark:text-red-400">
                                    Rejection reason
                                </p>

                                <p className="mt-2 text-sm leading-6">
                                    {request.rejectionReason}
                                </p>
                            </div>
                        )}

                    {request.reviewedOn && (
                        <div className="text-xs text-muted-foreground">
                            Reviewed on {request.reviewedOn}
                            {request.reviewedBy
                                ? ` by ${request.reviewedBy}`
                                : ""}
                        </div>
                    )}

                    {isPending && (
                        <div className="space-y-2">
                            <label
                                htmlFor={`rejection-reason-${request.id}`}
                                className="text-sm font-medium"
                            >
                                Rejection reason
                                <span className="ml-1 text-muted-foreground">
                                    (required only when rejecting)
                                </span>
                            </label>

                            <textarea
                                id={`rejection-reason-${request.id}`}
                                value={rejectionReason}
                                onChange={(event) =>
                                    setRejectionReason(event.target.value)
                                }
                                placeholder="Explain why this leave request is being rejected..."
                                rows={3}
                                disabled={processing}
                                className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                        </div>
                    )}

                    {error && (
                        <div
                            role="alert"
                            className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-700 dark:text-red-400"
                        >
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <DialogClose
                        render={
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                disabled={processing}
                            />
                        }
                    >
                        Close
                    </DialogClose>

                    {isPending && (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleReject}
                                disabled={processing}
                                className="rounded-xl border-red-500/30 text-red-700 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:text-red-400"
                            >
                                <X className="size-4" />
                                {processing ? "Processing..." : "Reject"}
                            </Button>

                            <Button
                                onClick={handleApprove}
                                disabled={processing}
                                className="rounded-xl"
                            >
                                <Check className="size-4" />
                                {processing ? "Processing..." : "Approve"}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DetailItem({ icon: Icon, label, value }) {
    return (
        <div className="rounded-xl border border-border/60 p-3">
            <div className="flex items-center gap-2">
                <Icon className="size-3.5 text-muted-foreground" />
                <p className="text-[11px] font-medium text-muted-foreground">
                    {label}
                </p>
            </div>

            <p className="mt-1.5 text-sm font-medium">{value}</p>
        </div>
    );
}

export default LeaveRequestDialog;