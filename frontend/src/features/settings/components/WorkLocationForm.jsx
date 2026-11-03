import { MapPin, Search, Save } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { workLocationSchema } from "../schemas/settingsSchemas";

const WorkLocationMap = lazy(() => import("./WorkLocationMap"));

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
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(workLocationSchema),
    defaultValues,
  });
  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const radiusMeters = watch("radiusMeters");
  const address = watch("address");
  const latitudeNumber = latitude === "" ? Number.NaN : Number(latitude);
  const longitudeNumber = longitude === "" ? Number.NaN : Number(longitude);
  const [lookupError, setLookupError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

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

  async function findAddress() {
    if (!address?.trim()) {
      setLookupError("Enter an address to find it on the map.");
      return;
    }

    setLookingUp(true);
    setLookupError("");
    try {
      const query = new URLSearchParams({
        q: address.trim(),
        format: "jsonv2",
        limit: "1",
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${query}`,
        { headers: { Accept: "application/json" } },
      );
      if (!response.ok) {
        throw new Error("Address lookup is unavailable. Try selecting the map.");
      }

      const [result] = await response.json();
      if (!result) {
        setLookupError("No matching address found. Select the location on the map.");
        return;
      }

      setValue("latitude", Number(result.lat), { shouldValidate: true });
      setValue("longitude", Number(result.lon), { shouldValidate: true });
    } catch (error) {
      setLookupError(error.message || "Unable to search this address.");
    } finally {
      setLookingUp(false);
    }
  }

  function selectCoordinates(nextLatitude, nextLongitude) {
    setValue("latitude", Number(nextLatitude.toFixed(6)), {
      shouldValidate: true,
    });
    setValue("longitude", Number(nextLongitude.toFixed(6)), {
      shouldValidate: true,
    });
  }

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

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={findAddress}
          disabled={lookingUp || !address?.trim()}
          className="rounded-xl"
        >
          <Search className="size-4" />
          {lookingUp ? "Finding address..." : "Find address on map"}
        </Button>
        <p className="self-center text-xs text-muted-foreground">
          Drag to pan, use + / - to zoom, or click to place the office pin.
        </p>
      </div>
      {lookupError && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {lookupError}
        </p>
      )}
      <Suspense
        fallback={
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
        }
      >
        <WorkLocationMap
          latitude={latitudeNumber}
          longitude={longitudeNumber}
          radiusMeters={radiusMeters}
          onSelect={selectCoordinates}
        />
      </Suspense>
      <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0" />
        Address search uses OpenStreetMap's public Nominatim service. Map tiles
        and address queries are sent to OpenStreetMap services.
      </p>

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