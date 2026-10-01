import { ArrowRight, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/shared/ThemeToggle";

function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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

        <nav className="hidden items-center gap-7 md:flex">
          <a
            href="#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>

          <a
            href="#how-it-works"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </a>

          <a
            href="#roles"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            For teams
          </a>
        </nav>

        <div className="flex items-center gap-2">
            <ThemeToggle/>
          <Link
            to="/login"
            className="hidden sm:inline-flex"
          >
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>

          <Link to="/register">
            <Button size="sm" className="rounded-lg">
              Get started
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>

        </div>
      </div>
    </header>
  );
}

export default LandingNavbar;