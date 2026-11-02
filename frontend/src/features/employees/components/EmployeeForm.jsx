import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  employeeSchema,
  employeeUpdateSchema,
} from "../schemas/employeeSchemas";
import {
  createEmployee,
  updateEmployee,
} from "../services/employeeService";
import { getLeavePolicies } from "@/features/leaves/services/leavePolicyService";

const departments = [
  "Engineering",
  "Human Resources",
  "Sales",
  "Finance",
  "Operations",
  "Design",
  "Marketing",
];

const employmentTypes = [
  "Full-time",
  "Part-time",
  "Contract",
  "Intern",
];

const workModes = ["Office", "Remote", "Hybrid"];

const locations = ["Head Office", "Remote"];

const statuses = ["Active", "Inactive"];

const defaultValues = {
  name: "",
  email: "",
  password: "",
  phone: "",
  employeeId: "",
  department: "",
  designation: "",
  employmentType: "",
  joiningDate: "",
  manager: "",
  workMode: "",
  location: "",
  status: "Active",
  wageModel: "Monthly",
  baseWage: 0,
  leaveAllocations: [],
};

function EmployeeForm({ employee = null }) {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState("");
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(!employee);
  const [leaveTypesError, setLeaveTypesError] = useState("");
  const [leaveAllocations, setLeaveAllocations] = useState(
    employee?.leaveAllocations ?? [],
  );

  const isEditing = Boolean(employee);

  const form = useForm({
    resolver: zodResolver(isEditing ? employeeUpdateSchema : employeeSchema),
    defaultValues: employee
      ? {
          name: employee.name ?? "",
          email: employee.email ?? "",
          password: "",
          phone: employee.phone?.replace("+91 ", "") ?? "",
          employeeId: employee.employeeCode ?? "",
          department: employee.department ?? "",
          designation: employee.designation ?? "",
          employmentType: employee.employmentType ?? "",
          joiningDate: employee.joiningDate ?? "",
          manager: employee.manager ?? "",
          workMode: employee.workMode ?? "",
          location: employee.location ?? "",
          status: employee.status ?? "Active",
          wageModel: employee.wageModel ?? "Monthly",
          baseWage: Number(employee.baseWage ?? 0),
          leaveAllocations: (employee.leaveAllocations ?? []).map(
            (allocation) => ({
              leaveTypeId: allocation.leaveTypeId,
              allocatedDays: Number(allocation.allocatedDays ?? 0),
              name: allocation.name,
            }),
          ),
        }
      : defaultValues,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (employee) {
      return;
    }

    let mounted = true;
    getLeavePolicies()
      .then((policies) => {
        if (mounted) {
          setValue(
            "leaveAllocations",
            policies
              .filter((policy) => policy.status === "Active")
              .map((policy) => ({
                leaveTypeId: policy.id,
                allocatedDays: Number(policy.annualAllocation),
                name: policy.name,
              })),
          );
          setLeaveAllocations(
            policies
              .filter((policy) => policy.status === "Active")
              .map((policy) => ({
                leaveTypeId: policy.id,
                allocatedDays: Number(policy.annualAllocation),
                name: policy.name,
              })),
          );
        }
      })
      .catch((error) => {
        if (mounted) {
          setLeaveTypesError(error.message || "Unable to load leave types.");
        }
      })
      .finally(() => {
        if (mounted) {
          setLeaveTypesLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [employee, setValue]);

  async function onSubmit(values) {
    setSubmitError("");
    if (leaveTypesLoading || leaveTypesError) {
      return;
    }
    try {
      if (isEditing) {
        await updateEmployee(employee.id, values);
      } else {
        await createEmployee(values);
      }
      navigate("/employees");
    } catch (error) {
      setSubmitError(error.message || "Unable to save the employee.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {employee && !employee.profileComplete && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          This employee registered with a company code. Complete their
          employee ID, employment, salary, and leave details to finish onboarding.
        </div>
      )}
      {submitError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {submitError}
        </div>
      )}
      {/* Personal information */}
      <section className="rounded-2xl border border-border/60 bg-card/55 p-5 shadow-sm backdrop-blur-sm sm:p-6">
        <div className="mb-6">
          <p className="text-sm font-semibold">Personal information</p>

          <p className="mt-1 text-xs text-muted-foreground">
            Basic information used for employee identification and
            communication.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label="Full name"
            required
            error={errors.name?.message}
          >
            {isEditing ? (
              <>
                <Input
                  value={employee.name}
                  readOnly
                  aria-readonly="true"
                  className="h-10 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  Employees provide their name during registration. Admins
                  cannot change it.
                </p>
              </>
            ) : (
              <Input
                {...register("name")}
                placeholder="e.g. Aarav Sharma"
                className="h-10 rounded-xl"
              />
            )}
          </FormField>

          <FormField
            label="Email address"
            required
            error={errors.email?.message}
          >
            <Input
              {...register("email")}
              type="email"
              placeholder="employee@example.com"
              className="h-10 rounded-xl"
            />
          </FormField>

          {!isEditing && (
            <FormField
              label="Initial account password"
              required
              error={errors.password?.message}
            >
              <Input
                {...register("password")}
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="h-10 rounded-xl"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Share this password securely with the employee. They can use
                their email address to sign in.
              </p>
            </FormField>
          )}

          <FormField
            label="Phone number"
            required
            error={errors.phone?.message}
          >
            <Input
              {...register("phone")}
              inputMode="numeric"
              placeholder="10-digit mobile number"
              className="h-10 rounded-xl"
            />
          </FormField>

          <FormField
            label="Employee ID"
            required
            error={errors.employeeId?.message}
          >
            <Input
              {...register("employeeId")}
              placeholder="e.g. EMP-009"
              disabled={isEditing && employee.profileComplete}
              className="h-10 rounded-xl"
            />
          </FormField>
        </div>
      </section>

      {/* Employment information */}
      <section className="rounded-2xl border border-border/60 bg-card/55 p-5 shadow-sm backdrop-blur-sm sm:p-6">
        <div className="mb-6">
          <p className="text-sm font-semibold">Employment information</p>

          <p className="mt-1 text-xs text-muted-foreground">
            Define the employee's organizational role and reporting structure.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label="Department"
            required
            error={errors.department?.message}
          >
            <SelectField {...register("department")}>
              <option value="">Select department</option>

              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </SelectField>
          </FormField>

          <FormField
            label="Designation"
            required
            error={errors.designation?.message}
          >
            <Input
              {...register("designation")}
              placeholder="e.g. Software Engineer"
              className="h-10 rounded-xl"
            />
          </FormField>

          <FormField
            label="Employment type"
            required
            error={errors.employmentType?.message}
          >
            <SelectField {...register("employmentType")}>
              <option value="">Select employment type</option>

              {employmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </SelectField>
          </FormField>

          <FormField
            label="Joining date"
            required
            error={errors.joiningDate?.message}
          >
            <Input
              {...register("joiningDate")}
              type="date"
              className="h-10 rounded-xl"
            />
          </FormField>

          <FormField
            label="Reporting manager"
            required
            error={errors.manager?.message}
          >
            <Input
              {...register("manager")}
              placeholder="Manager name"
              className="h-10 rounded-xl"
            />
          </FormField>
        </div>
      </section>

      {/* Work configuration */}
      <section className="rounded-2xl border border-border/60 bg-card/55 p-5 shadow-sm backdrop-blur-sm sm:p-6">
        <div className="mb-6">
          <p className="text-sm font-semibold">Work configuration</p>

          <p className="mt-1 text-xs text-muted-foreground">
            Configure how this employee works and where attendance can be
            recorded.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label="Work mode"
            required
            error={errors.workMode?.message}
          >
            <SelectField {...register("workMode")}>
              <option value="">Select work mode</option>

              {workModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </SelectField>
          </FormField>

          <FormField
            label="Assigned location"
            required
            error={errors.location?.message}
          >
            <SelectField {...register("location")}>
              <option value="">Select location</option>

              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </SelectField>
          </FormField>
        </div>
      </section>

      {/* Compensation and leave allocation */}
      <section className="rounded-2xl border border-border/60 bg-card/55 p-5 shadow-sm backdrop-blur-sm sm:p-6">
        <div className="mb-6">
          <p className="text-sm font-semibold">Salary and leave allocation</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Set the employee's base wage and annual allocation for each active
            leave type.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Wage model" required error={errors.wageModel?.message}>
            <SelectField {...register("wageModel")}>
              {["Monthly", "Daily", "Hourly"].map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </SelectField>
          </FormField>

          <FormField label="Base salary / wage" required error={errors.baseWage?.message}>
            <Input
              {...register("baseWage", { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className="h-10 rounded-xl"
            />
          </FormField>
        </div>

        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-medium">Leave days per year</h3>
          {leaveTypesError && (
            <p role="alert" className="text-sm text-destructive">
              {leaveTypesError}
            </p>
          )}
          {leaveTypesLoading ? (
            <p className="text-sm text-muted-foreground">Loading leave types...</p>
          ) : leaveAllocations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active leave types are configured. You can add them from the
              Leaves page.
            </p>
          ) : (
            leaveAllocations.map((allocation, index) => {
              const leaveType = employee?.leaveAllocations?.find(
                (item) => item.leaveTypeId === allocation.leaveTypeId,
              );
              return (
                <div
                  key={allocation.leaveTypeId}
                  className="grid items-center gap-3 sm:grid-cols-[1fr_180px]"
                >
                  <label
                    htmlFor={`leave-allocation-${allocation.leaveTypeId}`}
                    className="text-sm"
                  >
                    {leaveType?.name ?? allocation.name ?? `Leave type ${index + 1}`}
                  </label>
                  <Input
                    id={`leave-allocation-${allocation.leaveTypeId}`}
                    {...register(`leaveAllocations.${index}.allocatedDays`, {
                      valueAsNumber: true,
                    })}
                    type="number"
                    min="0"
                    max="365"
                    step="0.5"
                    className="h-10 rounded-xl"
                  />
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Status */}
      <section className="rounded-2xl border border-border/60 bg-card/55 p-5 shadow-sm backdrop-blur-sm sm:p-6">
        <div className="mb-6">
          <p className="text-sm font-semibold">Account status</p>

          <p className="mt-1 text-xs text-muted-foreground">
            Inactive employees can remain in historical records without being
            treated as active workforce members.
          </p>
        </div>

        <div className="max-w-md">
          <FormField
            label="Status"
            required
            error={errors.status?.message}
          >
            <SelectField {...register("status")}>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </SelectField>
          </FormField>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => navigate("/employees")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          className="rounded-xl"
          disabled={isSubmitting || leaveTypesLoading || Boolean(leaveTypesError)}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}

          {isSubmitting
            ? "Saving..."
            : isEditing
              ? "Save changes"
              : "Create employee"}
        </Button>
      </div>
    </form>
  );
}

function FormField({ label, required, error, children }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}

        {required && (
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

function SelectField({ children, ...props }) {
  return (
    <select
      {...props}
      className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </select>
  );
}

export default EmployeeForm;