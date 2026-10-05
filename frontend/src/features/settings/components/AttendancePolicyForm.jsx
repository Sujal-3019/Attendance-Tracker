import { Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { attendancePolicySchema } from "../schemas/settingsSchemas";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function AttendancePolicyForm({
  policy,
  onSubmit,
  saving = false,
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(attendancePolicySchema),
    defaultValues: policy,
  });

  useEffect(() => {
    if (policy) {
      reset(policy);
    }
  }, [policy, reset]);

  const overtimeEnabled = watch("overtimeEnabled");

  if (!policy) {
    return null;
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-7"
    >
      {/* Working hours */}
      <section>
        <div className="mb-4">
          <h3 className="text-sm font-semibold">
            Working hours
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Define the standard working schedule for employees.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Work start time"
            error={errors.workStartTime?.message}
          >
            <Input
              {...register("workStartTime")}
              type="time"
              className="h-10 rounded-xl"
            />
          </FormField>

          <FormField
            label="Work end time"
            error={errors.workEndTime?.message}
          >
            <Input
              {...register("workEndTime")}
              type="time"
              className="h-10 rounded-xl"
            />
          </FormField>
        </div>
      </section>

      {/* Attendance rules */}
      <section className="border-t border-border/60 pt-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">
            Attendance rules
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Configure lateness and minimum working-hour rules.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField
            label="Grace period"
            error={errors.gracePeriodMinutes?.message}
          >
            <NumberInput
              register={register("gracePeriodMinutes")}
              suffix="minutes"
            />
          </FormField>

          <FormField
            label="Late threshold"
            error={errors.lateThresholdMinutes?.message}
          >
            <NumberInput
              register={register("lateThresholdMinutes")}
              suffix="minutes"
            />
          </FormField>

          <FormField
            label="Minimum working hours"
            error={errors.minimumWorkingHours?.message}
          >
            <NumberInput
              register={register("minimumWorkingHours")}
              suffix="hours"
              step="0.5"
            />
          </FormField>

          <FormField
            label="Half-day threshold"
            error={errors.halfDayHours?.message}
          >
            <NumberInput
              register={register("halfDayHours")}
              suffix="hours"
              step="0.5"
            />
          </FormField>
        </div>
      </section>

      {/* Checkout */}
      <section className="border-t border-border/60 pt-6">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            {...register("earlyCheckoutAllowed")}
            type="checkbox"
            className="mt-0.5 size-4 rounded border-input accent-foreground"
          />

          <span>
            <span className="block text-sm font-medium">
              Allow early checkout
            </span>

            <span className="mt-0.5 block text-xs text-muted-foreground">
              Employees can check out before the scheduled end
              time. Attendance rules can still record the early
              departure.
            </span>
          </span>
        </label>
      </section>

      {/* Overtime */}
      <section className="border-t border-border/60 pt-6">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            {...register("overtimeEnabled")}
            type="checkbox"
            className="mt-0.5 size-4 rounded border-input accent-foreground"
          />

          <span>
            <span className="block text-sm font-medium">
              Enable overtime
            </span>

            <span className="mt-0.5 block text-xs text-muted-foreground">
              Track time worked beyond the scheduled working
              hours.
            </span>
          </span>
        </label>

        {overtimeEnabled && (
          <div className="mt-4 max-w-xs">
            <FormField
              label="Overtime starts after"
              error={errors.overtimeAfterMinutes?.message}
            >
              <NumberInput
                register={register(
                  "overtimeAfterMinutes",
                )}
                suffix="minutes"
              />
            </FormField>
          </div>
        )}
      </section>

      {/* Working days */}
      <section className="border-t border-border/60 pt-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">
            Working days
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Select the days employees are normally expected to
            work.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {DAYS.map((day) => (
            <label
              key={day}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 px-3 py-2.5 text-sm transition-colors hover:bg-muted/50"
            >
              <input
                {...register("workingDays")}
                type="checkbox"
                value={day}
                className="size-4 rounded border-input accent-foreground"
              />

              <span>{day.slice(0, 3)}</span>
            </label>
          ))}
        </div>

        {errors.workingDays?.message && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            {errors.workingDays.message}
          </p>
        )}
      </section>

      <div className="flex justify-end border-t border-border/60 pt-5">
        <Button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl sm:w-auto"
        >
          <Save className="size-4" />
          {saving ? "Saving..." : "Save attendance policy"}
        </Button>
      </div>
    </form>
  );
}

function NumberInput({
  register,
  suffix,
  step = "1",
}) {
  return (
    <div className="relative">
      <Input
        {...register}
        type="number"
        min="0"
        step={step}
        className="h-10 rounded-xl pr-16"
      />

      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
        {suffix}
      </span>
    </div>
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

export default AttendancePolicyForm;