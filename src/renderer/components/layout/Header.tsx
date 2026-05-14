import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import { GrowthLensLogo } from "../brand/GrowthLensLogo";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useCampaign } from "../../state/CampaignContext";

export function Header() {
  const { activeProject, parsedFile, loading, error, notice, clearError, clearNotice } = useCampaign();
  return (
    <header className="sticky top-0 z-10 border-b border-brand-border bg-background/95 px-7 py-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <GrowthLensLogo variant="compact" size="sm" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-normal text-brand-navy">GrowthLens Campaign Analyzer</h1>
              <Badge tone="blue">Campaign Intelligence</Badge>
            </div>
            <div className="mt-1 text-xs font-medium text-slate-500">
              by GrowthLens AI · {activeProject?.name ?? parsedFile?.fileName ?? "Turn marketing data into revenue decisions."}
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
            <Loader2 className="animate-spin" size={16} />
            {loading}
          </div>
        ) : null}
      </div>
      {error ? (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <span className="flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </span>
          <Button variant="ghost" size="icon" onClick={clearError} aria-label="Dismiss error">
            <X size={16} />
          </Button>
        </div>
      ) : null}
      {!error && notice ? (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            {notice}
          </span>
          <Button variant="ghost" size="icon" onClick={clearNotice} aria-label="Dismiss notice">
            <X size={16} />
          </Button>
        </div>
      ) : null}
    </header>
  );
}
