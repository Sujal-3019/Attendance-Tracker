import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

import AuthShell from "../components/AuthShell";
import EmployeeRegisterForm from "../components/EmployeeRegisterForm";

function EmployeeRegisterPage() {
  return (
    <AuthShell
      title="Join your organization"
      description="Create your employee account using the organization code provided by your administrator."
    >
      <div className="mb-6">
        <Link to="/register">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 gap-2 text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to account type
          </Button>
        </Link>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card/60 p-5 shadow-xl shadow-black/5 backdrop-blur-xl sm:p-7">
        <EmployeeRegisterForm />
      </div>

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

export default EmployeeRegisterPage;
