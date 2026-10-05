import { Settings2 } from "lucide-react";

function SettingsHeader() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card/70 shadow-sm">
        <Settings2 className="size-5 text-muted-foreground" />
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Settings
        </h1>

        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Configure your organization, attendance rules, payroll,
          locations, and notifications.
        </p>
      </div>
    </div>
  );
}

export default SettingsHeader;