import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import AuthShell from "../components/AuthShell";
import AdminRegisterForm from "../components/AdminRegisterForm";
import { getAdminRegistrationStatus } from "../services/authService";

function AdminRegisterPage() {
  const [status, setStatus] = useState({ loading: true, available: false, error: "" });

  useEffect(() => {
    let active = true;
    getAdminRegistrationStatus()
      .then((result) => {
        if (active) setStatus({ loading: false, available: result.available, error: "" });
      })
      .catch((error) => {
        if (active) setStatus({ loading: false, available: false, error: error.message });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <AuthShell
      title={status.available ? "Create your organization" : "Administrator setup"}
      description={
        status.available
          ? "Register the first administrator using your private one-time setup code."
          : "Administrator registration is available only during protected first-time setup."
      }
    >
      <div className="mb-6">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to account type
        </Link>
      </div>

      {status.loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Checking administrator setup...
        </div>
      ) : status.available ? (
        <div className="rounded-3xl border border-border/60 bg-card/60 p-5 shadow-xl shadow-black/5 backdrop-blur-xl sm:p-7">
          <AdminRegisterForm />
        </div>
      ) : (
        <div className="rounded-3xl border border-border/60 bg-card/60 p-5 shadow-xl shadow-black/5 backdrop-blur-xl sm:p-7">
          <p role={status.error ? "alert" : undefined} className="text-sm leading-6 text-muted-foreground">
            {status.error ||
              "Setup is disabled or an organization has already been created. Ask your server operator to configure the one-time setup code, or contact your administrator for access."}
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

export default AdminRegisterPage;
