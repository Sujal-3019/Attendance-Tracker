import { Clock3 } from "lucide-react";

function LandingFooter() {
  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
            <Clock3 className="size-4" />
          </div>

          <span className="text-sm font-semibold">Attendly</span>
        </div>

        <p className="text-xs text-muted-foreground">
          Workforce attendance and management platform.
        </p>
      </div>
    </footer>
  );
}

export default LandingFooter;