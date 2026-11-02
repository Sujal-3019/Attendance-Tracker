import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

function RegistrationSuccess({ organizationName, admin = false, enrollmentCode }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/60 p-7 text-center shadow-xl shadow-black/5 backdrop-blur-xl sm:p-9">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10">
        <CheckCircle2 className="size-7 text-emerald-600 dark:text-emerald-400" />
      </div>

      <h2 className="mt-6 text-2xl font-semibold tracking-tight">
        {admin ? "Administrator account created" : "Employee account created"}
      </h2>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {organizationName
          ? `Your account has been created for ${organizationName}.`
          : "Your employee account has been created successfully."}
      </p>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {admin
          ? "You are signed in and can now manage your organization."
          : "Your administrator has been notified to complete your employee profile. You can sign in using your email address or phone number and password."}
      </p>

      {admin && enrollmentCode && (
        <div className="mt-5 rounded-xl border border-border bg-background p-4 text-left">
          <p className="text-xs font-semibold">Initial company code</p>
          <code className="mt-2 block select-all break-all text-sm">{enrollmentCode}</code>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Save and share this code only with verified employees. You can generate a replacement from the Company Code page.
          </p>
        </div>
      )}

      <Link to={admin ? "/dashboard" : "/login"} className="mt-7 block">
        <Button size="lg" className="w-full rounded-xl">
          {admin ? "Continue to dashboard" : "Continue to login"}
          <ArrowRight className="size-4" />
        </Button>
      </Link>

      <Link
        to="/"
        className="mt-4 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Return to homepage
      </Link>
    </div>
  );
}

export default RegistrationSuccess;
