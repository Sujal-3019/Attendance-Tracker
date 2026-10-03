import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { employeeSchema } from "../schemas/employeeSchemas";
import {
  createEmployee,
  updateEmployee,
} from "../services/employeeService";

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

const managers = ["Demo Admin"];

const statuses = ["Active", "Inactive"];

const defaultValues = {
  name: "",
  email: "",
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
};

function EmployeeForm({ employee = null }) {
  const navigate = useNavigate();

  const isEditing = Boolean(employee);

  const form = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee
      ? {
          name: employee.name ?? "",
          email: employee.email ?? "",
          phone: employee.phone?.replace("+91 ", "") ?? "",
          employeeId: employee.id ?? "",
          department: employee.department ?? "",
          designation: employee.designation ?? "",
          employmentType: employee.employmentType ?? "",
          joiningDate: employee.joiningDate ?? "",
          manager: employee.manager ?? "Demo Admin",
          workMode: employee.workMode ?? "",
          location: employee.location ?? "",
          status: employee.status ?? "Active",
        }
      : defaultValues,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values) {
    if (isEditing) {
      await updateEmployee(employee.id, values);
    } else {
      await createEmployee(values);
    }

    navigate("/employees");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            <Input
              {...register("name")}
              placeholder="e.g. Aarav Sharma"
              className="h-10 rounded-xl"
            />
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
              disabled={isEditing}
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
            <SelectField {...register("manager")}>
              <option value="">Select manager</option>

              {managers.map((manager) => (
                <option key={manager} value={manager}>
                  {manager}
                </option>
              ))}
            </SelectField>
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
          disabled={isSubmitting}
        >
          <Save className="size-4" />

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