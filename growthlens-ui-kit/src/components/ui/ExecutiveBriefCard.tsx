import type { ReactNode } from "react";
import { FileDown } from "lucide-react";
import { cn } from "../../lib/cn";

export function ExecutiveBriefCard({
  title = "GrowthLens Executive Brief",
  clientName = "Client",
  companyName = "GrowthLens AI",
  summary,
  kpis,
  actionPlan,
  onExport,
  className
}: {
  title?: string;
  clientName?: string;
  companyName?: string;
  summary?: ReactNode;
  kpis?: ReactNode;
  actionPlan?: ReactNode;
  onExport?: () => void;
  className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-brand-border bg-white shadow-executive", className)}>
      <div className="flex items-start justify-between gap-4 bg-brand-navy p-8 text-white">
        <div>
          <div className="text-sm font-medium text-cyan-100">{companyName}</div>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-normal">{title}</h2>
          <p className="mt-2 text-sm text-slate-200">{clientName} · Turn marketing data into revenue decisions.</p>
        </div>
        {onExport ? (
          <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20" onClick={onExport}>
            <FileDown size={17} />
            Export Executive Brief
          </button>
        ) : null}
      </div>
      <div className="grid gap-6 p-8">
        <section>
          <h3 className="font-display text-lg font-semibold text-brand-navy">Executive Summary</h3>
          <div className="mt-2 text-sm leading-6 text-slate-700">{summary ?? "Generate the Decision Panel to populate the executive summary."}</div>
        </section>
        {kpis}
        {actionPlan ? (
          <section>
            <h3 className="font-display text-lg font-semibold text-brand-navy">Action Plan</h3>
            <div className="mt-3">{actionPlan}</div>
          </section>
        ) : null}
      </div>
    </section>
  );
}
