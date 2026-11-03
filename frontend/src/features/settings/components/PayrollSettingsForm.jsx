import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { payrollSettingsSchema } from "../schemas/settingsSchemas";

const fixedPolicy = {
  lateDeductionEnabled: false,
  lateDeductionType: "Per Minute",
  lateDeductionRate: 0,
  halfDayDeductionEnabled: false,
  halfDayDeductionType: "Half Day Wage",
  halfDayDeductionAmount: 0,
  absenceDeductionAmount: 0,
  absenceDeductionEnabled: true,
  absenceDeductionType: "Full Day Wage",
  overtimeEnabled: true,
  overtimeMultiplier: 1.5,
  paidLeaveDeduction: false,
  unpaidLeaveDeduction: true,
};

function PayrollSettingsForm({ initialValues, onSubmit, saving = false }) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(payrollSettingsSchema),
    defaultValues: {
      wageModel: "Monthly",
      defaultWage: 0,
      ...fixedPolicy,
      ...initialValues,
    },
  });
  const wageModel = watch("wageModel");

  useEffect(() => {
    reset({
      wageModel: "Monthly",
      defaultWage: 0,
      ...fixedPolicy,
      ...initialValues,
    });
  }, [initialValues, reset]);

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit({ ...values, ...fixedPolicy }))}
      className="space-y-8"
    >
      <section className="space-y-5">
        <div>
          <h3 className="text-base font-semibold">Default wage configuration</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Used when a new employee does not have an individual wage override.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wageModel">Wage model</Label>
            <select
              id="wageModel"
              {...register("wageModel")}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {["Monthly", "Daily", "Hourly"].map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            {errors.wageModel && <p className="text-sm text-destructive">{errors.wageModel.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultWage">Default {wageModel.toLowerCase()} wage</Label>
            <Input
              id="defaultWage"
              type="number"
              min="0"
              step="0.01"
              {...register("defaultWage")}
            />
            {errors.defaultWage && <p className="text-sm text-destructive">{errors.defaultWage.message}</p>}
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border p-4 text-sm">
        <h3 className="font-semibold">Payroll calculation rules</h3>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Monthly wages are prorated by scheduled workdays; daily and hourly wages use payable workdays and recorded hours.</li>
          <li>Approved paid leave is paid. Absences and approved unpaid leave reduce monthly wages; no late-arrival deductions apply.</li>
          <li>Approved overtime is paid at 1.5× the wage-model hourly equivalent.</li>
          <li>Scheduled salary-advance installments are deducted once per period and capped at net earnings.</li>
        </ul>
        <p className="text-amber-700 dark:text-amber-300">
          TDS, EPF, ESI, and professional tax are not calculated until current rules, jurisdiction, and coverage are configured.
        </p>
      </section>

      <div className="flex justify-end border-t pt-6">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save payroll settings"}
        </Button>
      </div>
    </form>
  );
}

export default PayrollSettingsForm;
