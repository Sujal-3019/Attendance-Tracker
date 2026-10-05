import { z } from "zod";

export const payrollFilterSchema = z.object({
  search: z.string().trim().max(100).optional(),
  department: z.string().optional(),
  wageModel: z.enum(["All", "Monthly", "Daily", "Hourly"]),
  payrollStatus: z.enum(["All", "Ready", "Needs Review"]),
});

export const payrollPeriodSchema = z.object({
  month: z.coerce
    .number()
    .int()
    .min(1)
    .max(12),

  year: z.coerce
    .number()
    .int()
    .min(2020)
    .max(2100),
});