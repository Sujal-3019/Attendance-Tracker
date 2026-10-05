import { z } from "zod";

export const leavePolicySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Leave type name must be at least 2 characters")
    .max(50, "Leave type name is too long"),

  code: z
    .string()
    .trim()
    .min(2, "Code must be at least 2 characters")
    .max(10, "Code must be 10 characters or less")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Code can contain only letters, numbers, hyphens, and underscores",
    ),

  description: z
    .string()
    .trim()
    .min(5, "Description is required")
    .max(200, "Description is too long"),

  annualAllocation: z.coerce
    .number()
    .int("Allocation must be a whole number")
    .min(0, "Allocation cannot be negative")
    .max(365, "Allocation cannot exceed 365 days"),

  paid: z.boolean(),

  carryForward: z.boolean(),

  maxConsecutiveDays: z.coerce
    .number()
    .int("Maximum days must be a whole number")
    .min(1, "Maximum consecutive days must be at least 1")
    .max(365, "Maximum consecutive days cannot exceed 365"),
});