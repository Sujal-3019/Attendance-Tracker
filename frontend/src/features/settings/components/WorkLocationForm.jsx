import { Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { workLocationSchema } from "../schemas/settingsSchemas";

const defaultValues = {
  name: "",
  address: "",
  latitude: "",
  longitude: "",
  radiusMeters: 150,
  primary: false,
};

function WorkLocationForm({
  location = null,
  onSubmit,
  onCancel,
  saving = false,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(workLocationSchema),
    defaultValues,
  });

  useEffect(() => {
    if (location) {
      reset({
        name: location.name,
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        radiusMeters: location.radiusMeters,
        primary: location.primary,
      });
    } else {
      reset(defaultValues);
    }
  }, [location, reset]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Location name"
          error={errors.name?.message}
        >
          <Input
            {...register("name")}
            placeholder="e.g. Main Office"
            className="rounded-xl"
          />
        </FormField>

        <FormField
          label="Geofence radius"
          error={errors.radiusMeters?.message}
        >
          <div className="relative">
            <Input
              {...register("radiusMeters")}
              type="number"
              min="50"
              max="5000"
              className="rounded-xl pr-20"
            />

            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              meters
            </span>
          </div>
        </FormField>
      </div>

      <FormField
        label="Address"
        error={errors.address?.message}
      >
        <textarea
          {...register("address")}
          rows={3}
          placeholder="Enter the workplace address"
          className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Latitude"
          error={errors.latitude?.message}
        >
          <Input
            {...register("latitude")}
            type="number"
            step="any"
            placeholder="28.5355"
            className="rounded-xl"
          />
        </FormField>

        <FormField
          label="Longitude"
          error={errors.longitude?.message}
        >
          <Input
            {...register("longitude")}
            type="number"
            step="any"
            placeholder="77.3910"
            className="rounded-xl"
          />
        </FormField>
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            {...register("primary")}
            type="checkbox"
            className="mt-0.5 size-4 rounded border-input accent-foreground"
          />

          <span>
            <span className="block text-sm font-medium">
              Set as primary location
            </span>

            <span className="mt-0.5 block text-xs text-muted-foreground">
              The primary location is used as the default
              workplace for new employees.
            </span>
          </span>
        </label>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl"
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={saving}
          className="rounded-xl"
        >
          <Save className="size-4" />
          {saving ? "Saving..." : "Save location"}
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

export default WorkLocationForm;