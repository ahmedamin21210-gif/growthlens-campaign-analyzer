import type { AIInsightResponse } from "@shared/types";
import { AlertTriangle, Brain, CheckCircle2, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/Badge";

export function AIInsightsPanel({ insights, onGenerate, disabled, busy }: { insights: AIInsightResponse | null; onGenerate: () => void; disabled?: boolean; busy?: boolean }) {
  const stringifyItem = (item: Record<string, unknown>) =>
    Object.entries(item)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => `${key.replace(/_/g, " ")}: ${String(value)}`)
      .join(" · ");
  const risks = insights?.risks?.length ? insights.risks : insights?.main_problems ?? [];
  const opportunities = insights?.growth_opportunities?.length ? insights.growth_opportunities : insights?.main_opportunities ?? [];
  const keyFindings = insights?.key_findings ?? [];
  const budgetActions = insights?.budget_actions ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Brain size={18} />
            Decision Panel
          </CardTitle>
          <p className="mt-1 text-sm text-slate-500">Executive-ready guidance from deterministic KPI calculations and detected issues.</p>
        </div>
        <Button onClick={onGenerate} disabled={disabled || busy}>
          <Sparkles size={17} />
          {busy ? "Generating" : "Generate Decision Panel"}
        </Button>
      </CardHeader>
      <CardContent>
        {insights ? (
          <div className="grid gap-5">
            <section>
              <h3 className="text-sm font-semibold text-brand-navy">Executive Summary</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{insights.executive_summary}</p>
            </section>
            <section className="grid grid-cols-2 gap-4">
              <div className="rounded-md border border-border bg-slate-50 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
                  <AlertTriangle size={15} className="text-brand-amber" />
                  Risks
                </h3>
                <ul className="mt-2 grid gap-2 text-sm text-slate-700">
                  {risks.length ? risks.map((item) => <li key={item}>{item}</li>) : <li>No major risks were detected.</li>}
                </ul>
              </div>
              <div className="rounded-md border border-border bg-slate-50 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
                  <TrendingUp size={15} className="text-brand-green" />
                  Growth Opportunities
                </h3>
                <ul className="mt-2 grid gap-2 text-sm text-slate-700">
                  {opportunities.length ? opportunities.map((item) => <li key={item}>{item}</li>) : <li>No immediate growth opportunities were detected.</li>}
                </ul>
              </div>
            </section>
            <section>
              <h3 className="text-sm font-semibold text-brand-navy">Key Findings</h3>
              <div className="mt-2 grid gap-2 text-sm text-slate-700">
                {keyFindings.length ? (
                  keyFindings.slice(0, 8).map((item) => (
                    <div key={`${item.title}-${item.evidence}`} className="rounded-xl border border-brand-border bg-white px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold text-brand-navy">{item.title}</div>
                        <Badge tone={item.severity === "critical" || item.severity === "high" ? "red" : item.severity === "medium" ? "amber" : "green"}>{item.severity}</Badge>
                      </div>
                      <p className="mt-1">{item.description}</p>
                      {item.evidence ? <p className="mt-1 text-xs text-slate-500">Evidence: {item.evidence}</p> : null}
                    </div>
                  ))
                ) : (
                  [...risks, ...opportunities].slice(0, 6).map((item) => (
                    <div key={item} className="rounded-xl border border-brand-border bg-white px-3 py-2">
                      {item}
                    </div>
                  ))
                )}
              </div>
            </section>
            <section>
              <h3 className="text-sm font-semibold text-brand-navy">Action Plan</h3>
              <div className="mt-2 grid gap-2 text-sm text-slate-700">
                {[...(insights.campaign_recommendations ?? []), ...budgetActions, ...(insights.budget_recommendations ?? [])].slice(0, 8).map((item, index) => (
                  <div key={index} className="rounded-xl border border-brand-border bg-white px-3 py-2">
                    {stringifyItem(item as Record<string, unknown>)}
                  </div>
                ))}
              </div>
            </section>
            {insights.audit_note ? (
              <section className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-slate-700">
                <h3 className="flex items-center gap-2 font-semibold text-brand-navy">
                  <CheckCircle2 size={15} className="text-brand-cyan" />
                  Audit Note
                </h3>
                <p className="mt-1">{insights.audit_note}</p>
              </section>
            ) : null}
            <section>
              <h3 className="text-sm font-semibold text-brand-navy">Next Steps</h3>
              <ol className="mt-2 grid gap-2 text-sm text-slate-700">
                {insights.next_steps.map((item) => <li key={item}>{item}</li>)}
              </ol>
            </section>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
            Generate the Decision Panel after the deterministic analysis is complete.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
