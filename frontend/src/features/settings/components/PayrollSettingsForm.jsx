import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { payrollSettingsSchema } from "../schemas/settingsSchemas";

const wageModels = ["Monthly", "Daily", "Hourly"];

const deductionTypes = [
    "Per Minute",
    "Fixed Amount",
];

const halfDayDeductionTypes = [
    "Half Day Wage",
    "Fixed Amount",
];

const absenceDeductionTypes = [
    "Full Day Wage",
    "Fixed Amount",
];

function PayrollSettingsForm({
    initialValues,
    onSubmit,
    saving = false,
}) {
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(payrollSettingsSchema),
        defaultValues: initialValues,
    });

    useEffect(() => {
        reset(initialValues);
    }, [initialValues, reset]);

    const wageModel = watch("wageModel");
    const lateDeductionEnabled = watch("lateDeductionEnabled");
    const halfDayDeductionEnabled = watch("halfDayDeductionEnabled");
    const absenceDeductionEnabled = watch("absenceDeductionEnabled");
    const overtimeEnabled = watch("overtimeEnabled");
    const paidLeaveDeduction = watch("paidLeaveDeduction");
    const unpaidLeaveDeduction = watch("unpaidLeaveDeduction");

    const lateDeductionType = watch("lateDeductionType");
    const halfDayDeductionType = watch("halfDayDeductionType");
    const absenceDeductionType = watch("absenceDeductionType");

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Wage Configuration */}
            <section className="space-y-5">
                <div>
                    <h3 className="text-base font-semibold">
                        Wage configuration
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Configure the default wage model used for payroll calculations.
                    </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="wageModel">Wage model</Label>

                        <select
                            id="wageModel"
                            {...register("wageModel")}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                        >
                            {wageModels.map((model) => (
                                <option key={model} value={model}>
                                    {model}
                                </option>
                            ))}
                        </select>

                        {errors.wageModel && (
                            <p className="text-sm text-destructive">
                                {errors.wageModel.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="defaultWage">
                            Default {wageModel.toLowerCase()} wage
                        </Label>

                        <Input
                            id="defaultWage"
                            type="number"
                            min="0"
                            step="0.01"
                            {...register("defaultWage")}
                            placeholder="45000"
                        />

                        {errors.defaultWage && (
                            <p className="text-sm text-destructive">
                                {errors.defaultWage.message}
                            </p>
                        )}

                        <p className="text-xs text-muted-foreground">
                            This is the default wage used when an employee does not have
                            an individual payroll override.
                        </p>
                    </div>
                </div>
            </section>

            <div className="border-t" />

            {/* Late Deduction */}
            <section className="space-y-5">
                <div>
                    <h3 className="text-base font-semibold">
                        Late attendance deduction
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Define how late arrivals affect employee wages.
                    </p>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <div>
                        <p className="text-sm font-medium">
                            Enable late deduction
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Deduct wages when an employee exceeds the configured late
                            threshold.
                        </p>
                    </div>

                    <Switch
                        checked={lateDeductionEnabled}
                        onCheckedChange={(value) =>
                            setValue("lateDeductionEnabled", value, {
                                shouldValidate: true,
                            })
                        }
                    />
                </div>

                {lateDeductionEnabled && (
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="lateDeductionType">
                                Deduction method
                            </Label>

                            <select
                                id="lateDeductionType"
                                {...register("lateDeductionType")}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                            >
                                {deductionTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>

                            {errors.lateDeductionType && (
                                <p className="text-sm text-destructive">
                                    {errors.lateDeductionType.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lateDeductionRate">
                                {lateDeductionType === "Per Minute"
                                    ? "Deduction per minute"
                                    : "Fixed deduction amount"}
                            </Label>

                            <Input
                                id="lateDeductionRate"
                                type="number"
                                min="0"
                                step="0.01"
                                {...register("lateDeductionRate")}
                                placeholder="25"
                            />

                            {errors.lateDeductionRate && (
                                <p className="text-sm text-destructive">
                                    {errors.lateDeductionRate.message}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </section>

            <div className="border-t" />

            {/* Half Day */}
            <section className="space-y-5">
                <div>
                    <h3 className="text-base font-semibold">
                        Half-day deduction
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Configure how half-day attendance affects wages.
                    </p>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <div>
                        <p className="text-sm font-medium">
                            Enable half-day deduction
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Apply a deduction when attendance falls below the configured
                            half-day threshold.
                        </p>
                    </div>

                    <Switch
                        checked={halfDayDeductionEnabled}
                        onCheckedChange={(value) =>
                            setValue("halfDayDeductionEnabled", value, {
                                shouldValidate: true,
                            })
                        }
                    />
                </div>

                {halfDayDeductionEnabled && (
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="halfDayDeductionType">
                                Deduction method
                            </Label>

                            <select
                                id="halfDayDeductionType"
                                {...register("halfDayDeductionType")}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                            >
                                {halfDayDeductionTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>

                            {errors.halfDayDeductionType && (
                                <p className="text-sm text-destructive">
                                    {errors.halfDayDeductionType.message}
                                </p>
                            )}
                        </div>

                        {halfDayDeductionType === "Fixed Amount" && (
                            <div className="space-y-2">
                                <Label htmlFor="halfDayDeductionAmount">
                                    Deduction amount
                                </Label>

                                <Input
                                    id="halfDayDeductionAmount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    {...register("halfDayDeductionAmount")}
                                    placeholder="500"
                                />

                                {errors.halfDayDeductionAmount && (
                                    <p className="text-sm text-destructive">
                                        {errors.halfDayDeductionAmount.message}
                                    </p>
                                )}

                                <p className="text-xs text-muted-foreground">
                                    Fixed amount deducted when an employee is marked half-day.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </section>

            <div className="border-t" />

            {/* Absence */}
            <section className="space-y-5">
                <div>
                    <h3 className="text-base font-semibold">
                        Absence deduction
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Configure how unauthorized absences affect employee wages.
                    </p>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <div>
                        <p className="text-sm font-medium">
                            Enable absence deduction
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Deduct wages for days marked as absent.
                        </p>
                    </div>

                    <Switch
                        checked={absenceDeductionEnabled}
                        onCheckedChange={(value) =>
                            setValue("absenceDeductionEnabled", value, {
                                shouldValidate: true,
                            })
                        }
                    />
                </div>

                {absenceDeductionEnabled && (
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="absenceDeductionType">
                                Deduction method
                            </Label>

                            <select
                                id="absenceDeductionType"
                                {...register("absenceDeductionType")}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                            >
                                {absenceDeductionTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>

                            {errors.absenceDeductionType && (
                                <p className="text-sm text-destructive">
                                    {errors.absenceDeductionType.message}
                                </p>
                            )}
                        </div>

                        {absenceDeductionType === "Fixed Amount" && (
                            <div className="space-y-2">
                                <Label htmlFor="absenceDeductionAmount">
                                    Deduction amount
                                </Label>

                                <Input
                                    id="absenceDeductionAmount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    {...register("absenceDeductionAmount")}
                                    placeholder="1500"
                                />

                                {errors.absenceDeductionAmount && (
                                    <p className="text-sm text-destructive">
                                        {errors.absenceDeductionAmount.message}
                                    </p>
                                )}

                                <p className="text-xs text-muted-foreground">
                                    Fixed amount deducted when an employee is marked absent.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </section>

            <div className="border-t" />

            {/* Overtime */}
            <section className="space-y-5">
                <div>
                    <h3 className="text-base font-semibold">
                        Overtime
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Configure additional compensation for approved overtime.
                    </p>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <div>
                        <p className="text-sm font-medium">
                            Enable overtime
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Allow overtime compensation based on the organization's
                            attendance policy.
                        </p>
                    </div>

                    <Switch
                        checked={overtimeEnabled}
                        onCheckedChange={(value) =>
                            setValue("overtimeEnabled", value, {
                                shouldValidate: true,
                            })
                        }
                    />
                </div>

                {overtimeEnabled && (
                    <div className="max-w-md space-y-2">
                        <Label htmlFor="overtimeMultiplier">
                            Overtime multiplier
                        </Label>

                        <Input
                            id="overtimeMultiplier"
                            type="number"
                            min="1"
                            max="5"
                            step="0.1"
                            {...register("overtimeMultiplier")}
                            placeholder="1.5"
                        />

                        {errors.overtimeMultiplier && (
                            <p className="text-sm text-destructive">
                                {errors.overtimeMultiplier.message}
                            </p>
                        )}

                        <p className="text-xs text-muted-foreground">
                            Example: 1.5 means overtime is paid at 150% of the normal
                            hourly rate.
                        </p>
                    </div>
                )}
            </section>

            <div className="border-t" />

            {/* Leave Treatment */}
            <section className="space-y-5">
                <div>
                    <h3 className="text-base font-semibold">
                        Leave treatment
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Decide whether approved leave should affect employee wages.
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                        <div>
                            <p className="text-sm font-medium">
                                Deduct paid leave
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Usually disabled because paid leave should not reduce wages.
                            </p>
                        </div>

                        <Switch
                            checked={paidLeaveDeduction}
                            onCheckedChange={(value) =>
                                setValue("paidLeaveDeduction", value, {
                                    shouldValidate: true,
                                })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                        <div>
                            <p className="text-sm font-medium">
                                Deduct unpaid leave
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Deduct wages for approved unpaid leave.
                            </p>
                        </div>

                        <Switch
                            checked={unpaidLeaveDeduction}
                            onCheckedChange={(value) =>
                                setValue("unpaidLeaveDeduction", value, {
                                    shouldValidate: true,
                                })
                            }
                        />
                    </div>
                </div>
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