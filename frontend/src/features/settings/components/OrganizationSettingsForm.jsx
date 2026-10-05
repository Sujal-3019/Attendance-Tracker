import { Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { organizationSettingsSchema } from "../schemas/settingsSchemas";

function OrganizationSettingsForm({
  settings,
  onSubmit,
  saving = false,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: settings,
  });

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  if (!settings) {
    return null;
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Organization name"
          error={errors.organizationName?.message}
        >
          <Input
            {...register("organizationName")}
            placeholder="Your organization name"
            className="h-10 rounded-xl"
          />
        </FormField>

        <FormField
          label="Organization email"
          error={errors.organizationEmail?.message}
        >
          <Input
            {...register("organizationEmail")}
            type="email"
            placeholder="admin@example.com"
            className="h-10 rounded-xl"
          />
        </FormField>

        <FormField
          label="Phone number"
          error={errors.phone?.message}
        >
          <Input
            {...register("phone")}
            type="tel"
            placeholder="+91 98765 43210"
            className="h-10 rounded-xl"
          />
        </FormField>

        <FormField
          label="Timezone"
          error={errors.timezone?.message}
        >
          <select
            {...register("timezone")}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          >
            <option value="Asia/Kolkata">
              India Standard Time (IST)
            </option>

            <option value="Asia/Dubai">
              Gulf Standard Time (GST)
            </option>

            <option value="Europe/London">
              Greenwich Mean Time (GMT)
            </option>

            <option value="America/New_York">
              Eastern Time (ET)
            </option>

            <option value="America/Los_Angeles">
              Pacific Time (PT)
            </option>

            <option value="UTC">
              Coordinated Universal Time (UTC)
            </option>
          </select>
        </FormField>

        <FormField
          label="Currency"
          error={errors.currency?.message}
        >
          <select
            {...register("currency")}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          >
            <option value="INR">Indian Rupee (INR)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="GBP">British Pound (GBP)</option>
            <option value="AED">UAE Dirham (AED)</option>
          </select>
        </FormField>

        <FormField
          label="Date format"
          error={errors.dateFormat?.message}
        >
          <select
            {...register("dateFormat")}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </FormField>
      </div>

      <FormField
        label="Organization address"
        error={errors.address?.message}
      >
        <textarea
          {...register("address")}
          rows={3}
          placeholder="Enter your organization's address"
          className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </FormField>

      <div className="flex justify-end border-t border-border/60 pt-5">
        <Button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl sm:w-auto"
        >
          <Save className="size-4" />

          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function FormField({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label}
      </label>

      {children}

      {error && (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export default OrganizationSettingsForm;