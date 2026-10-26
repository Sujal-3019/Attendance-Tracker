import { z } from "zod";

const employeeFields = {
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),

  phone: z.string().trim().regex(/^[6-9]\d{4}\s?\d{5}$/, "Enter a valid 10-digit mobile number"),


  employeeId: z
    .string()
    .trim()
    .min(3, "Employee ID is required")
    .max(30, "Employee ID is too long"),

  department: z
    .string()
    .min(1, "Select a department"),

  designation: z
    .string()
    .trim()
    .min(2, "Designation is required")
    .max(100, "Designation is too long"),

  employmentType: z
    .string()
    .min(1, "Select an employment type"),

  joiningDate: z
    .string()
    .min(1, "Joining date is required"),

  manager: z
    .string()
    .min(1, "Select a reporting manager"),

  workMode: z
    .string()
    .min(1, "Select a work mode"),

  location: z
    .string()
    .min(1, "Select a location"),

  status: z
    .string()
    .min(1, "Select employee status"),
};

export const employeeSchema = z.object(employeeFields);
export const employeeUpdateSchema = z.object(
  Object.fromEntries(
    Object.entries(employeeFields).filter(([field]) => field !== "password"),
  ),
);