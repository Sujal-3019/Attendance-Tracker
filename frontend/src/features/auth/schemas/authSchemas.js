import { z } from "zod";

export const adminRegisterSchema = z
  .object({
    organizationName: z
      .string()
      .trim()
      .min(2, "Organization name must be at least 2 characters.")
      .max(100, "Organization name cannot exceed 100 characters."),

    organizationType: z
      .string()
      .min(1, "Please select an organization type."),

    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .max(100, "Full name cannot exceed 100 characters."),

    email: z
      .string()
      .trim()
      .email("Please enter a valid email address."),

    phone: z
      .string()
      .trim()
      .regex(
        /^[6-9]\d{9}$/,
        "Please enter a valid 10-digit Indian mobile number.",
      ),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password cannot exceed 128 characters."),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const organizationTypes = [
  {
    value: "office",
    label: "Office / Company",
  },
  {
    value: "factory",
    label: "Factory / Manufacturing",
  },
  {
    value: "retail",
    label: "Retail / Store",
  },
  {
    value: "field",
    label: "Field Workforce",
  },
  {
    value: "other",
    label: "Other",
  },
];

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address."),

  password: z
    .string()
    .min(1, "Please enter your password."),
});

export const employeeRegisterSchema = z
  .object({
    organizationCode: z
      .string()
      .trim()
      .min(4, "Organization code must be at least 4 characters.")
      .max(30, "Organization code cannot exceed 30 characters."),

    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .max(100, "Full name cannot exceed 100 characters."),

    email: z
      .string()
      .trim()
      .email("Please enter a valid email address."),

    phone: z
      .string()
      .trim()
      .regex(
        /^[6-9]\d{9}$/,
        "Please enter a valid 10-digit Indian mobile number.",
      ),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password cannot exceed 128 characters."),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
