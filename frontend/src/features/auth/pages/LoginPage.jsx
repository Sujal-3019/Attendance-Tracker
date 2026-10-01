import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

import AuthShell from "../components/AuthShell";
import LoginForm from "../components/LoginForm";

function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to manage attendance, workforce activity and leave."
    >
      <div className="mb-6">
        <Link to="/">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 gap-2 text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to homepage
          </Button>
        </Link>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card/60 p-5 shadow-xl shadow-black/5 backdrop-blur-xl sm:p-7">
        <LoginForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export default LoginPage;
