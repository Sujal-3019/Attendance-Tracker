import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

import AttendancePolicyForm from "./AttendancePolicyForm";
import {
  getAttendancePolicy,
  updateAttendancePolicy,
} from "../services/settingsService";

function AttendancePolicy() {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPolicy() {
      try {
        const data = await getAttendancePolicy();

        if (mounted) {
          setPolicy(data);
        }
      } catch {
        if (mounted) {
          setError("Unable to load attendance policy.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPolicy();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(values) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const updatedPolicy =
        await updateAttendancePolicy(values);

      setPolicy(updatedPolicy);
      setMessage("Attendance policy saved successfully.");

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (saveError) {
      setError(
        saveError.message ||
          "Unable to save attendance policy.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-card/55 p-5 shadow-sm backdrop-blur-xl sm:p-6">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Clock3 className="size-4" />
        </div>

        <div>
          <h2 className="text-sm font-semibold">
            Attendance policy
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Define how working hours, lateness, early checkout,
            and overtime are handled.
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

          <AttendancePolicyForm
            policy={policy}
            onSubmit={handleSubmit}
            saving={saving}
          />
        </>
      )}
    </section>
  );
}

export default AttendancePolicy;