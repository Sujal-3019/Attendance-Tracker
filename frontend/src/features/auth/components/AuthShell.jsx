import { Clock3 } from "lucide-react";
import { Link } from "react-router-dom";

import ThemeToggle from "@/components/shared/ThemeToggle";

function AuthShell({ children, title, description }) {
  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background shadow-sm">
              <Clock3 className="size-4" />
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold tracking-tight">
                Attendly
              </p>
              <p className="text-[10px] font-medium text-muted-foreground">
                Workforce management
              </p>
            </div>
          </Link>

          <ThemeToggle />
        </div>

        {/* Content */}
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              {title && (
                <h1 className="text-3xl font-semibold tracking-[-0.03em]">
                  {title}
                </h1>
              )}

              {description && (
                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              )}
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthShell;
