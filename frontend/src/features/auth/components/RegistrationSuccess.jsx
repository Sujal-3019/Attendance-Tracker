import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

function RegistrationSuccess({ organizationName }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/60 p-7 text-center shadow-xl shadow-black/5 backdrop-blur-xl sm:p-9">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10">
        <CheckCircle2 className="size-7 text-emerald-600 dark:text-emerald-400" />
      </div>

      <h2 className="mt-6 text-2xl font-semibold tracking-tight">
        Organization created
      </h2>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {organizationName
          ? `${organizationName} has been created successfully.`
          : "Your organization has been created successfully."}
      </p>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Your administrator account is ready. You can now sign in and
        configure your workforce.
      </p>

      <Link to="/login" className="mt-7 block">
        <Button size="lg" className="w-full rounded-xl">
          Continue to login
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
