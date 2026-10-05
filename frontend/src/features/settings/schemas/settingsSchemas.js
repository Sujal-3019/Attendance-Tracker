import { z } from "zod";

export const organizationSettingsSchema = z.object({
    organizationName: z
        .string()
        .trim()
        .min(2, "Organization name is required")
        .max(100, "Organization name is too long"),

    organizationEmail: z
        .string()
        .trim()
        .email("Enter a valid email address"),

    phone: z
        .string()
        .trim()
        .min(10, "Enter a valid phone number")
        .max(20, "Phone number is too long"),

    address: z
        .string()
        .trim()
        .min(5, "Address is required")
        .max(250, "Address is too long"),

    timezone: z
        .string()
        .min(1, "Timezone is required"),

    currency: z
        .string()
        .min(1, "Currency is required"),

    dateFormat: z
        .string()
        .min(1, "Date format is required"),
});

export const attendancePolicySchema = z
    .object({
        workStartTime: z
            .string()
            .regex(
                /^([01]\d|2[0-3]):([0-5]\d)$/,
                "Enter a valid time",
            ),

        workEndTime: z
            .string()
            .regex(
                /^([01]\d|2[0-3]):([0-5]\d)$/,
                "Enter a valid time",
            ),

        gracePeriodMinutes: z.coerce
            .number()
            .int()
            .min(0, "Cannot be negative")
            .max(120, "Cannot exceed 120 minutes"),

        lateThresholdMinutes: z.coerce
            .number()
            .int()
            .min(1, "Must be at least 1 minute")
            .max(240, "Cannot exceed 240 minutes"),

        minimumWorkingHours: z.coerce
            .number()
            .min(0.5, "Must be at least 0.5 hours")
            .max(24, "Cannot exceed 24 hours"),

        halfDayHours: z.coerce
            .number()
            .min(0.5, "Must be at least 0.5 hours")
            .max(24, "Cannot exceed 24 hours"),

        earlyCheckoutAllowed: z.boolean(),

        overtimeEnabled: z.boolean(),

        overtimeAfterMinutes: z.coerce
            .number()
            .int()
            .min(0)
            .max(600),

        workingDays: z
            .array(z.string())
            .min(1, "Select at least one working day"),
    })
    .refine(
        (data) => data.workEndTime > data.workStartTime,
        {
            message: "Work end time must be after start time",
            path: ["workEndTime"],
        },
    )
    .refine(
        (data) =>
            data.lateThresholdMinutes >=
            data.gracePeriodMinutes,
        {
            message:
                "Late threshold should be greater than or equal to the grace period",
            path: ["lateThresholdMinutes"],
        },
    )
    .refine(
        (data) =>
            data.halfDayHours <= data.minimumWorkingHours,
        {
            message:
                "Half-day hours cannot exceed minimum working hours",
            path: ["halfDayHours"],
        },
    );


export const workLocationSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Location name is required")
        .max(80, "Location name is too long"),

    address: z
        .string()
        .trim()
        .min(5, "Address is required")
        .max(250, "Address is too long"),

    latitude: z.coerce
        .number()
        .min(-90, "Latitude must be between -90 and 90")
        .max(90, "Latitude must be between -90 and 90"),

    longitude: z.coerce
        .number()
        .min(-180, "Longitude must be between -180 and 180")
        .max(180, "Longitude must be between -180 and 180"),

    radiusMeters: z.coerce
        .number()
        .int("Radius must be a whole number")
        .min(50, "Radius must be at least 50 meters")
        .max(5000, "Radius cannot exceed 5000 meters"),

    primary: z.boolean(),
});

export const payrollSettingsSchema = z
    .object({
        wageModel: z.enum(["Monthly", "Daily", "Hourly"]),

        defaultWage: z.coerce
            .number()
            .min(0, "Wage cannot be negative")
            .max(100000000, "Wage is too large"),

        lateDeductionEnabled: z.boolean(),

        lateDeductionType: z.enum([
            "Per Minute",
            "Fixed Amount",
        ]),

        lateDeductionRate: z.coerce
            .number()
            .min(0, "Deduction rate cannot be negative")
            .max(1000000, "Deduction rate is too large"),

        halfDayDeductionEnabled: z.boolean(),

        halfDayDeductionType: z.enum([
            "Half Day Wage",
            "Fixed Amount",
        ]),

        halfDayDeductionAmount: z.coerce
            .number()
            .min(0, "Deduction amount cannot be negative")
            .max(1000000, "Deduction amount is too large"),

        absenceDeductionAmount: z.coerce
            .number()
            .min(0, "Deduction amount cannot be negative")
            .max(1000000, "Deduction amount is too large"),

        absenceDeductionEnabled: z.boolean(),

        absenceDeductionType: z.enum([
            "Full Day Wage",
            "Fixed Amount",
        ]),

        overtimeEnabled: z.boolean(),

        overtimeMultiplier: z.coerce
            .number()
            .min(1, "Overtime multiplier must be at least 1")
            .max(5, "Overtime multiplier cannot exceed 5"),

        paidLeaveDeduction: z.boolean(),

        unpaidLeaveDeduction: z.boolean(),
    })
    .superRefine((data, context) => {
        if (
            data.halfDayDeductionEnabled &&
            data.halfDayDeductionType === "Fixed Amount" &&
            data.halfDayDeductionAmount <= 0
        ) {
            context.addIssue({
                code: "custom",
                message: "Enter a half-day deduction amount greater than 0",
                path: ["halfDayDeductionAmount"],
            });
        }

        if (
            data.lateDeductionEnabled &&
            data.lateDeductionType === "Fixed Amount" &&
            data.lateDeductionRate <= 0
        ) {
            context.addIssue({
                code: "custom",
                message: "Enter a fixed deduction amount greater than 0",
                path: ["lateDeductionRate"],
            });
        }

        if (
            data.absenceDeductionEnabled &&
            data.absenceDeductionType === "Fixed Amount" &&
            data.absenceDeductionAmount <= 0
        ) {
            context.addIssue({
                code: "custom",
                message: "Enter an absence deduction amount greater than 0",
                path: ["absenceDeductionAmount"],
            });
        }
    });