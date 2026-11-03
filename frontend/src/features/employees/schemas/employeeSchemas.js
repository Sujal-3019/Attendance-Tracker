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

  workMode: z.enum(["Office", "Remote", "Hybrid"]),

  location: z
    .string()
    .min(1, "Select a location"),

  hybridOfficeDays: z.array(
    z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
  ),

  status: z
    .string()
    .min(1, "Select employee status"),

  wageModel: z
    .enum(["Monthly", "Daily", "Hourly"]),

  baseWage: z.coerce
    .number()
    .min(0, "Salary cannot be negative")
    .max(100000000, "Salary is too large"),

  basicSalary: z.preprocess(
    (value) => value === "" || value == null ? null : Number(value),
    z.number().min(0).nullable(),
  ),
  dearnessAllowance: z.preprocess(
    (value) => value === "" || value == null ? null : Number(value),
    z.number().min(0).nullable(),
  ),
  houseRentAllowance: z.preprocess(
    (value) => value === "" || value == null ? null : Number(value),
    z.number().min(0).nullable(),
  ),
  otherAllowances: z.preprocess(
    (value) => value === "" || value == null ? null : Number(value),
    z.number().min(0).nullable(),
  ),

  leaveAllocations: z.array(
    z.object({
      leaveTypeId: z.string().uuid(),
      allocatedDays: z.coerce.number().min(0).max(365),
    }),
  ),
};

function validateWorkConfiguration(data, context) {
  const salaryParts = [
    data.basicSalary,
    data.dearnessAllowance,
    data.houseRentAllowance,
    data.otherAllowances,
  ];
  if (salaryParts.some((value) => value !== null)) {
    if (salaryParts.some((value) => value === null)) {
      context.addIssue({
        code: "custom",
        path: ["basicSalary"],
        message: "Enter all four salary components or leave them all blank.",
      });
    } else {
      const componentTotalCents = salaryParts.reduce(
        (total, value) => total + Math.round(value * 100),
        0,
      );
      if (componentTotalCents !== Math.round(data.baseWage * 100)) {
        context.addIssue({
          code: "custom",
          path: ["baseWage"],
          message: "Total base salary is calculated from the salary components.",
        });
      }
    }
  }
  if (data.workMode === "Hybrid") {
    if (data.hybridOfficeDays.length < 1 || data.hybridOfficeDays.length > 6) {
      context.addIssue({
        code: "custom",
        path: ["hybridOfficeDays"],
        message: "Choose at least one office day and leave at least one remote day.",
      });
    }
    if (data.location === "Remote") {
      context.addIssue({
        code: "custom",
        path: ["location"],
        message: "Hybrid employees must be assigned an office.",
      });
    }
  } else if (data.hybridOfficeDays.length) {
    context.addIssue({
      code: "custom",
      path: ["hybridOfficeDays"],
      message: "A weekly office schedule is only used for Hybrid employees.",
    });
  }
  if (data.workMode === "Office" && data.location === "Remote") {
    context.addIssue({
      code: "custom",
      path: ["location"],
      message: "Office employees must be assigned an office.",
    });
  }
  if (data.workMode === "Remote" && data.location !== "Remote") {
    context.addIssue({
      code: "custom",
      path: ["location"],
      message: "Remote employees must use Remote as their assigned location.",
    });
  }
}

export const employeeSchema = z
  .object(employeeFields)
  .superRefine(validateWorkConfiguration);
export const employeeUpdateSchema = z
  .object(
  Object.fromEntries(
    Object.entries(employeeFields).filter(
      ([field]) => !["password", "name"].includes(field),
    ),
    ),
  )
  .superRefine(validateWorkConfiguration);