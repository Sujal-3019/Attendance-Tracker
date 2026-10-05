import { useEffect, useState } from "react";

import PayrollSettingsForm from "./PayrollSettingsForm";
import {
  getPayrollSettings,
  updatePayrollSettings,
} from "../services/settingsService";

function PayrollSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const data = await getPayrollSettings();
        setSettings(data);
      } catch (loadError) {
        setError(
          loadError.message || "Unable to load payroll settings.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  async function handleSubmit(values) {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updatedSettings = await updatePayrollSettings(values);

      setSettings(updatedSettings);
      setSuccess("Payroll settings updated successfully.");
    } catch (saveError) {
      setError(
        saveError.message || "Unable to update payroll settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border bg-background/80 p-6 shadow-sm">
        <div className="space-y-4 animate-pulse">
          <div className="h-5 w-48 rounded bg-muted" />
          <div className="h-4 w-72 rounded bg-muted" />
          <div className="h-10 w-full rounded bg-muted" />
          <div className="h-10 w-full rounded bg-muted" />
          <div className="h-10 w-40 rounded bg-muted" />
        </div>
      </section>
    );
  }

  if (!settings) {
    return (
      <section className="rounded-2xl border bg-background/80 p-6 shadow-sm">
        <p className="text-sm text-destructive">
          {error || "Payroll settings could not be loaded."}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border bg-background/80 shadow-sm">
      <div className="border-b p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Payroll & wage rules
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Configure default wage rules, attendance deductions,
            overtime, and leave treatment for your organization.
          </p>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
          >
            {success}
          </div>
        )}

        <PayrollSettingsForm
          initialValues={settings}
          onSubmit={handleSubmit}
          saving={saving}
        />
      </div>
    </section>
  );
}

export default PayrollSettings;