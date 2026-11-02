import { KeyRound, RefreshCw } from "lucide-react";
import { useState } from "react";

import AppShell from "@/app/layouts/AppShell";
import { Button } from "@/components/ui/button";
import { generateCompanyCode } from "../services/settingsService";

function CompanyCodePage() {
  const [companyCode, setCompanyCode] = useState("");
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const result = await generateCompanyCode();
      setCompanyCode(result.companyCode);
    } catch (requestError) {
      setError(requestError.message || "Unable to generate a company code.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <p className="text-sm font-medium text-muted-foreground">
            Organization
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Company Code
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Generate a code and share it with employees you authorize to
            register with your organization.
          </p>
        </header>

        <section className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <KeyRound className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Employee enrollment</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Codes are stored securely and cannot be retrieved after
                generation. Generating a new code immediately invalidates the
                previous one. Share the displayed code privately.
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {companyCode && (
            <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-medium text-muted-foreground">
                New company code — shown only once
              </p>
              <code className="mt-2 block select-all break-all text-lg font-semibold">
                {companyCode}
              </code>
            </div>
          )}

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="mt-6 rounded-xl"
          >
            <RefreshCw className={`size-4 ${generating ? "animate-spin" : ""}`} />
            {generating
              ? "Generating..."
              : companyCode
                ? "Generate and rotate code"
                : "Generate company code"}
          </Button>
        </section>
      </div>
    </AppShell>
  );
}

export default CompanyCodePage;
