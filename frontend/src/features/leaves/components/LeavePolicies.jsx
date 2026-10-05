import { MoreHorizontal, Pencil, Plus, Power } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import LeavePolicyForm from "./LeavePolicyForm";
import {
  createLeavePolicy,
  updateLeavePolicy,
  updateLeavePolicyStatus,
} from "../services/leavePolicyService";

function LeavePolicies({ policies, onPoliciesChanged }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function openCreateDialog() {
    setEditingPolicy(null);
    setError("");
    setDialogOpen(true);
  }

  function openEditDialog(policy) {
    setEditingPolicy(policy);
    setError("");
    setDialogOpen(true);
  }

  async function handleSubmit(values) {
    setSubmitting(true);
    setError("");

    try {
      if (editingPolicy) {
        await updateLeavePolicy(editingPolicy.id, values);
      } else {
        await createLeavePolicy(values);
      }

      await onPoliciesChanged();
      setDialogOpen(false);
    } catch (submitError) {
      setError(
        submitError.message || "Unable to save leave policy.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(policy) {
    setError("");

    try {
      const nextStatus =
        policy.status === "Active" ? "Inactive" : "Active";

      await updateLeavePolicyStatus(policy.id, nextStatus);
      await onPoliciesChanged();
    } catch (statusError) {
      setError(
        statusError.message ||
          "Unable to update policy status.",
      );
    }
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-card/55 p-5 shadow-sm backdrop-blur-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">
            Leave policies
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Configure leave allocation and usage rules.
          </p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        >
          <DialogTrigger
            render={
              <Button
                onClick={openCreateDialog}
                className="w-full rounded-xl sm:w-auto"
              />
            }
          >
            <Plus className="size-4" />
            Add leave type
          </DialogTrigger>

          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editingPolicy
                  ? "Edit leave policy"
                  : "Add leave type"}
              </DialogTitle>

              <DialogDescription>
                Configure how this leave type is allocated and
                used by employees.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-700 dark:text-red-400"
              >
                {error}
              </div>
            )}

            <LeavePolicyForm
              policy={editingPolicy}
              onSubmit={handleSubmit}
              onCancel={() => setDialogOpen(false)}
              submitting={submitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      {error && !dialogOpen && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </div>
      )}

      <div className="mt-5 space-y-3">
        {policies.map((policy) => (
          <div
            key={policy.id}
            className="rounded-xl border border-border/60 p-4 transition-colors hover:bg-muted/30"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-semibold">
                  {policy.code}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">
                      {policy.name}
                    </h3>

                    <PolicyStatus status={policy.status} />
                  </div>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {policy.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4 lg:w-130">
                <PolicyValue
                  label="Allocation"
                  value={`${policy.annualAllocation} days`}
                />

                <PolicyValue
                  label="Maximum"
                  value={`${policy.maxConsecutiveDays} days`}
                />

                <PolicyValue
                  label="Type"
                  value={policy.paid ? "Paid" : "Unpaid"}
                />

                <PolicyValue
                  label="Carry forward"
                  value={policy.carryForward ? "Yes" : "No"}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label={`Actions for ${policy.name}`}
                    />
                  }
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => openEditDialog(policy)}
                  >
                    <Pencil className="size-4" />
                    Edit policy
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => handleStatusChange(policy)}
                  >
                    <Power className="size-4" />
                    {policy.status === "Active"
                      ? "Deactivate"
                      : "Activate"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PolicyStatus({ status }) {
  const active = status === "Active";

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
        active
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-border bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

function PolicyValue({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">
        {label}
      </p>

      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}

export default LeavePolicies;