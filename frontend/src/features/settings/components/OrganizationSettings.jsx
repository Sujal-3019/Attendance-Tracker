import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";

import OrganizationSettingsForm from "./OrganizationSettingsForm";
import {
  getOrganizationSettings,
  updateOrganizationSettings,
} from "../services/settingsService";

function OrganizationSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const data = await getOrganizationSettings();

        if (mounted) {
          setSettings(data);
        }
      } catch {
        if (mounted) {
          setError("Unable to load organization settings.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(values) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const updatedSettings =
        await updateOrganizationSettings(values);

      setSettings(updatedSettings);
      setMessage("Organization settings saved successfully.");

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (saveError) {
      setError(
        saveError.message ||
          "Unable to save organization settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-card/55 p-5 shadow-sm backdrop-blur-xl sm:p-6">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Building2 className="size-4" />
        </div>

        <div>
          <h2 className="text-sm font-semibold">
            Organization details
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Basic information used across your attendance and
            payroll system.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-10 animate-pulse rounded-xl bg-muted" />
          <div className="h-10 animate-pulse rounded-xl bg-muted" />
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
        </div>
      ) : (
        <>
          {message && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-400"
            >
              {message}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-700 dark:text-red-400"
            >
              {error}
            </div>
          )}

          <OrganizationSettingsForm
            settings={settings}
            onSubmit={handleSubmit}
            saving={saving}
          />
        </>
      )}
    </section>
  );
}

export default OrganizationSettings;