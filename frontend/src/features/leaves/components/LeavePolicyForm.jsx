import { Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { leavePolicySchema } from "../schemas/leavePolicySchemas";

const defaultValues = {
  name: "",
  code: "",
  description: "",
  annualAllocation: 0,
  paid: true,
  carryForward: false,
  maxConsecutiveDays: 1,
};

function LeavePolicyForm({
  policy = null,
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(leavePolicySchema),
    defaultValues,
  });

  useEffect(() => {
    if (policy) {
      reset({
        name: policy.name,
        code: policy.code,
        description: policy.description,
        annualAllocation: policy.annualAllocation,
        paid: policy.paid,
        carryForward: policy.carryForward,
        maxConsecutiveDays: policy.maxConsecutiveDays,
      });
    } else {
      reset(defaultValues);
    }
  }, [policy, reset]);

  const paid = watch("paid");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Leave type name"
          error={errors.name?.message}
        >
          <Input
            {...register("name")}
            placeholder="e.g. Casual Leave"
            className="rounded-xl"
          />
        </FormField>

        <FormField
          label="Code"
          error={errors.code?.message}
        >
          <Input
            {...register("code")}
            placeholder="e.g. CL"
            className="rounded-xl uppercase"
          />
        </FormField>
      </div>

      <FormField
        label="Description"
        error={errors.description?.message}
      >
        <textarea
          {...register("description")}
          rows={3}
          placeholder="Describe when employees can use this leave type..."
          className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Annual allocation"
          error={errors.annualAllocation?.message}
        >
          <Input
            {...register("annualAllocation")}
            type="number"
            min="0"
            max="365"
            className="rounded-xl"
          />

          <p className="mt-1 text-[11px] text-muted-foreground">
            Number of days allocated per year.
          </p>
        </FormField>

        <FormField
          label="Maximum consecutive days"
          error={errors.maxConsecutiveDays?.message}
        >
          <Input
            {...register("maxConsecutiveDays")}
            type="number"
            min="1"
            max="365"
            className="rounded-xl"
          />

          <p className="mt-1 text-[11px] text-muted-foreground">
            Maximum continuous leave allowed.
          </p>
        </FormField>
      </div>

      <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            {...register("paid")}
            type="checkbox"
            className="mt-0.5 size-4 rounded border-input accent-foreground"
          />

          <span>
            <span className="block text-sm font-medium">
              Paid leave
            </span>

            <span className="mt-0.5 block text-xs text-muted-foreground">
              Approved leave does not reduce the employee's eligible
              salary for the covered days.
            </span>
          </span>
        </label>

        <label
          className={`flex items-start gap-3 ${
            !paid ? "opacity-50" : ""
          }`}
        >
          <input
            {...register("carryForward")}
            type="checkbox"
            disabled={!paid}
            className="mt-0.5 size-4 rounded border-input accent-foreground"
          />

          <span>
            <span className="block text-sm font-medium">
              Allow carry forward
            </span>

            <span className="mt-0.5 block text-xs text-muted-foreground">
              Unused balance can be carried into the next leave year.
            </span>
          </span>
        </label>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-xl"
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={submitting}
          className="rounded-xl"
        >
          <Save className="size-4" />
          {submitting ? "Saving..." : "Save policy"}
        </Button>
      </div>
    </form>
  );
}

function FormField({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label}
      </label>

      {children}

      {error && (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export default LeavePolicyForm;