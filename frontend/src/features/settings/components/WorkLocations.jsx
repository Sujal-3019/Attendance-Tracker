import {
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import WorkLocationForm from "./WorkLocationForm";
import {
  createWorkLocation,
  getWorkLocations,
  updateWorkLocation,
  updateWorkLocationStatus,
} from "../services/settingsService";

function WorkLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadLocations() {
    const data = await getWorkLocations();
    setLocations(data);
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await getWorkLocations();

        if (mounted) {
          setLocations(data);
        }
      } catch {
        if (mounted) {
          setError("Unable to load work locations.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  function openCreateDialog() {
    setEditingLocation(null);
    setError("");
    setDialogOpen(true);
  }

  function openEditDialog(location) {
    setEditingLocation(location);
    setError("");
    setDialogOpen(true);
  }

  async function handleSubmit(values) {
    setSaving(true);
    setError("");

    try {
      if (editingLocation) {
        await updateWorkLocation(
          editingLocation.id,
          values,
        );
      } else {
        await createWorkLocation(values);
      }

      await loadLocations();
      setDialogOpen(false);
    } catch (saveError) {
      setError(
        saveError.message ||
          "Unable to save work location.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(location) {
    setError("");

    try {
      const nextStatus =
        location.status === "Active"
          ? "Inactive"
          : "Active";

      await updateWorkLocationStatus(
        location.id,
        nextStatus,
      );

      await loadLocations();
    } catch (statusError) {
      setError(
        statusError.message ||
          "Unable to update location status.",
      );
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-border/60 bg-card/55 p-5 shadow-sm backdrop-blur-xl sm:p-6">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-5 h-24 animate-pulse rounded-xl bg-muted" />
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-card/55 p-5 shadow-sm backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
            <MapPin className="size-4" />
          </div>

          <div>
            <h2 className="text-sm font-semibold">
              Work locations
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Configure approved workplaces and their geofence
              boundaries.
            </p>
          </div>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        >
          <DialogTrigger
            render={
              <Button
                onClick={openCreateDialog}
                className="w-full rounded-xl sm:w-auto"
              />
            }
          >
            <Plus className="size-4" />
            Add location
          </DialogTrigger>

          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editingLocation
                  ? "Edit work location"
                  : "Add work location"}
              </DialogTitle>

              <DialogDescription>
                Configure the workplace coordinates and allowed
                attendance radius.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-700 dark:text-red-400"
              >
                {error}
              </div>
            )}

            <WorkLocationForm
              location={editingLocation}
              onSubmit={handleSubmit}
              onCancel={() => setDialogOpen(false)}
              saving={saving}
            />
          </DialogContent>
        </Dialog>
      </div>

      {error && !dialogOpen && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </div>
      )}

      <div className="mt-5 space-y-3">
        {locations.map((location) => (
          <div
            key={location.id}
            className="rounded-xl border border-border/60 p-4 transition-colors hover:bg-muted/30"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <MapPin className="size-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">
                      {location.name}
                    </h3>

                    <LocationStatus
                      status={location.status}
                    />

                    {location.primary && (
                      <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400">
                        Primary
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {location.address}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5 text-xs lg:w-95">
                <LocationValue
                  label="Latitude"
                  value={location.latitude}
                />

                <LocationValue
                  label="Longitude"
                  value={location.longitude}
                />

                <LocationValue
                  label="Radius"
                  value={`${location.radiusMeters} m`}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={`Actions for ${location.name}`}
                    />
                  }
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      openEditDialog(location)
                    }
                  >
                    <Pencil className="size-4" />
                    Edit location
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() =>
                      handleStatusChange(location)
                    }
                  >
                    <Power className="size-4" />
                    {location.status === "Active"
                      ? "Deactivate"
                      : "Activate"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {locations.length === 0 && (
        <div className="mt-5 flex min-h-32 items-center justify-center rounded-xl border border-dashed border-border/70">
          <p className="text-sm text-muted-foreground">
            No work locations configured.
          </p>
        </div>
      )}
    </section>
  );
}

function LocationStatus({ status }) {
  const active = status === "Active";

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
        active
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-border bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

function LocationValue({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">
        {label}
      </p>

      <p className="mt-0.5 font-medium">
        {value}
      </p>
    </div>
  );
}

export default WorkLocations;