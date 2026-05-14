import type { ReactNode } from "react";
import { Brain, Sparkles } from "lucide-react";
import { ChartCard } from "./ChartCard";

export function DecisionPanel({
  subtitle = "Executive-ready guidance from deterministic KPI calculations and detected issues.",
  executiveSummary,
  keyFindings = [],
  growthOpportunities = [],
  risks = [],
  actionPlan,
  nextSteps = [],
  onGenerate,
  generateLabel = "Generate Decision Panel"
}: {
  subtitle?: string;
  executiveSummary?: ReactNode;
  keyFindings?: ReactNode[];
  growthOpportunities?: ReactNode[];
  risks?: ReactNode[];
  actionPlan?: ReactNode;
  nextSteps?: ReactNode[];
  onGenerate?: () => void;
  generateLabel?: string;
}) {
  return (
    <ChartCard
      title="Decision Panel"
      subtitle={subtitle}
      action={
        onGenerate ? (
          <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-brand-navy bg-brand-navy px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#15113a]" onClick={onGenerate}>
            <Sparkles size={17} />
            {generateLabel}
          </button>
        ) : null
      }
    >
      <div className="grid gap-5">
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
            <Brain size={16} />
            Executive Summary
          </h3>
          <div className="mt-2 text-sm leading-6 text-slate-700">{executiveSummary ?? "Generate the Decision Panel after analysis is complete."}</div>
        </section>
        <section className="grid grid-cols-2 gap-4">
          <PanelList title="Growth Opportunities" items={growthOpportunities} />
          <PanelList title="Risks" items={risks} />
        </section>
        <PanelList title="Key Findings" items={keyFindings} />
        {actionPlan ? <section>{actionPlan}</section> : null}
        <PanelList title="Next Steps" items={nextSteps} ordered />
      </div>
    </ChartCard>
  );
}

function PanelList({ title, items, ordered = false }: { title: string; items: ReactNode[]; ordered?: boolean }) {
  const List = ordered ? "ol" : "div";
  return (
    <section className="rounded-2xl border border-brand-border bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-brand-navy">{title}</h3>
      <List className="mt-2 grid gap-2 text-sm leading-6 text-slate-700">
        {items.length ? items.map((item, index) => <div key={index}>{item}</div>) : <div className="text-slate-500">No items yet.</div>}
      </List>
    </section>
  );
}
