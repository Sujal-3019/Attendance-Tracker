import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import EmployeeAppShell from "../../layouts/EmployeeAppShell";
import {
  getMyProfile,
  updateMyProfile,
} from "../services/employeeProfileService";

function Detail({ label, value, icon: Icon }) {
  return (
    <div className="flex min-w-0 gap-3 rounded-xl border border-slate-200/70 bg-white/70 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 wrap-break-words font-medium text-slate-900">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

export default function EmployeeProfilePage() {
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    getMyProfile()
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setPhone(data.phone);
      })
      .catch(() => {
        if (active) {
          setError("Unable to load your profile. Please try again.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const cleanedPhone = phone.trim();

    if (cleanedPhone && !/^[+()\d\s-]{7,20}$/.test(cleanedPhone)) {
      setError("Enter a valid phone number.");
      return;
    }

    setSaving(true);

    try {
      const updated = await updateMyProfile({
        phone: cleanedPhone,
      });

      setProfile(updated);
      setPhone(updated.phone);
      setEditing(false);
      setSuccess("Your contact details have been updated.");
    } catch {
      setError("Unable to save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function cancelEditing() {
    setPhone(profile.phone);
    setEditing(false);
    setError("");
  }

  return (
    <EmployeeAppShell>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header>
          <p className="text-sm font-medium text-cyan-700">
            Employee self-service
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            My Profile
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            View your employment information and manage your contact details.
          </p>
        </header>

        {loading ? (
          <div className="rounded-2xl border bg-white p-8 text-sm text-slate-500">
            Loading your profile...
          </div>
        ) : !profile ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error || "Your profile could not be loaded."}
          </div>
        ) : (
          <>
            <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
              <div className="h-24 bg-linear-to-r from-cyan-100 via-sky-100 to-blue-100 sm:h-32" />

              <div className="px-5 pb-6 sm:px-8">
                <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex min-w-0 items-end gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-slate-100 text-slate-600 shadow-sm sm:h-24 sm:w-24">
                      <UserRound size={38} />
                    </div>

                    <div className="min-w-0 pb-1">
                      <h2 className="wrap-break-words text-xl font-semibold text-slate-900 sm:text-2xl">
                        {profile.fullName}
                      </h2>
                      <p className="mt-1 wrap-break-words text-sm text-slate-500">
                        {profile.designation} · {profile.department}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 sm:self-auto">
                    <ShieldCheck size={16} />
                    Employee account
                  </div>
                </div>
              </div>
            </section>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            {success && (
              <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
                {success}
              </p>
            )}

            <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Contact information
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Keep your contact details up to date.
                  </p>
                </div>

                {!editing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setError("");
                      setSuccess("");
                      setEditing(true);
                    }}
                  >
                    <Pencil size={16} className="mr-2" />
                    Edit contact
                  </Button>
                )}
              </div>

              {editing ? (
                <form onSubmit={handleSave} className="max-w-xl space-y-4">
                  <div>
                    <label
                      htmlFor="profile-phone"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Phone number
                    </label>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 focus-within:ring-2 focus-within:ring-cyan-600">
                      <Phone size={18} className="shrink-0 text-slate-400" />
                      <input
                        id="profile-phone"
                        type="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="Enter your phone number"
                        maxLength={20}
                        className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEditing}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Detail label="Work email" value={profile.email} icon={Mail} />
                  <Detail label="Phone number" value={profile.phone} icon={Phone} />
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  Employment details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  These details are managed by your organization.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Detail
                  label="Employee ID"
                  value={profile.employeeId}
                  icon={ShieldCheck}
                />
                <Detail
                  label="Department"
                  value={profile.department}
                  icon={BriefcaseBusiness}
                />
                <Detail
                  label="Designation"
                  value={profile.designation}
                  icon={UserRound}
                />
                <Detail
                  label="Employment type"
                  value={profile.employmentType}
                  icon={BriefcaseBusiness}
                />
                <Detail
                  label="Joining date"
                  value={profile.joiningDate}
                  icon={CalendarDays}
                />
                <Detail
                  label="Work mode"
                  value={profile.workMode}
                  icon={MapPin}
                />
                <Detail
                  label="Reporting manager"
                  value={profile.manager}
                  icon={UserRound}
                />
              </div>
            </section>
          </>
        )}
      </div>
    </EmployeeAppShell>
  );
}