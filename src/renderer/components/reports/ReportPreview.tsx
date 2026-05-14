import type { AnalysisSummary, AIInsightResponse, BrandingSettings } from "@shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { money, percent } from "../../lib/utils";

export function ReportPreview({
  analysis,
  aiInsights,
  branding
}: {
  analysis: AnalysisSummary;
  aiInsights: AIInsightResponse | null;
  branding: BrandingSettings;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Executive Brief preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <div className="p-8 text-white" style={{ background: branding.primaryColor }}>
            <div className="text-sm">{branding.companyName}</div>
            <h1 className="mt-2 text-3xl font-bold tracking-normal">GrowthLens Executive Brief</h1>
            <p className="mt-2 text-sm opacity-90">{branding.clientName || "Client"} · Generated today</p>
          </div>
          <div className="p-8">
            <h2 className="text-lg font-semibold text-brand-navy">Executive Summary</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{aiInsights?.executive_summary ?? "Generate the Decision Panel to populate the executive summary."}</p>
            <div className="mt-6 grid grid-cols-4 gap-3">
              <div className="rounded-md border border-border p-3"><div className="text-xs text-slate-500">Spend</div><div className="text-lg font-bold">{money(analysis.overall.totalSpend)}</div></div>
              <div className="rounded-md border border-border p-3"><div className="text-xs text-slate-500">Revenue</div><div className="text-lg font-bold">{money(analysis.overall.totalRevenue)}</div></div>
              <div className="rounded-md border border-border p-3"><div className="text-xs text-slate-500">ROAS</div><div className="text-lg font-bold">{analysis.overall.roas?.toFixed(2) ?? "-"}</div></div>
              <div className="rounded-md border border-border p-3"><div className="text-xs text-slate-500">CTR</div><div className="text-lg font-bold">{percent(analysis.overall.ctr)}</div></div>
            </div>
            <h2 className="mt-7 text-lg font-semibold text-brand-navy">Action Plan</h2>
            <div className="mt-3 grid gap-2">
              {analysis.recommendations.slice(0, 5).map((item) => (
                <div key={`${item.campaignName}-${item.issue}`} className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                  <strong>{item.campaignName ? `${item.campaignName}: ` : ""}</strong>
                  {item.action}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
