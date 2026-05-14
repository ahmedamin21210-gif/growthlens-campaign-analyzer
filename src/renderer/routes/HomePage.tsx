import { ArrowRight, BarChart3, Brain, FileSpreadsheet, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GrowthLensLogo } from "../components/brand/GrowthLensLogo";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { useCampaign } from "../state/CampaignContext";
import { formatDate } from "../lib/utils";

export function HomePage() {
  const navigate = useNavigate();
  const { projects, analysis, loadSampleData } = useCampaign();
  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-border bg-white p-8 shadow-sm">
        <div className="grid grid-cols-[1fr_340px] gap-8">
          <div>
            <GrowthLensLogo variant="full" size="md" className="mb-6" />
            <div className="mb-4 inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-800">
              Local-first campaign intelligence
            </div>
            <h1 className="max-w-4xl text-4xl font-bold tracking-normal text-brand-navy">Turn campaign data into revenue decisions.</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              GrowthLens Campaign gives agencies, analysts, media buyers, and business owners an executive command center for KPI analysis, Leak Detector alerts, and Action Plans.
            </p>
            <div className="mt-7 flex gap-3">
              <Button onClick={() => navigate("/upload")}>
                <FileSpreadsheet size={18} />
                Upload Campaign Data
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  const ok = await loadSampleData();
                  if (ok) navigate("/mapping");
                }}
              >
                Load demo data
              </Button>
            </div>
          </div>
          <div className="grid gap-3">
            {[
              { label: "Analyze KPI performance", icon: BarChart3 },
              { label: "Run Leak Detector", icon: ArrowRight },
              { label: "Generate Decision Panel", icon: Brain },
              { label: "Export Executive Briefs", icon: FolderOpen }
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-brand-border bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                <item.icon size={18} className="text-brand-cyan" />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-[1fr_360px] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent workspaces</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {projects.length ? (
              projects.slice(0, 5).map((project) => (
                <button
                  key={project.id}
                  className="flex items-center justify-between rounded-md border border-border bg-white p-4 text-left transition hover:bg-slate-50"
                  onClick={() => navigate("/projects")}
                >
                  <div>
                    <div className="font-medium text-slate-950">{project.name}</div>
                    <div className="text-sm text-slate-500">{project.clientName || "No client"} · Updated {formatDate(project.updatedAt)}</div>
                  </div>
                  <ArrowRight size={18} className="text-slate-400" />
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">No saved workspaces yet.</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {analysis ? (
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Campaigns</span><strong>{analysis.overall.campaignCount}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Action Plan items</span><strong>{analysis.recommendations.length}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Leak Detector alerts</span><strong>{analysis.wastedSpend.length}</strong></div>
                <Button className="mt-3" onClick={() => navigate("/dashboard")}>Open Command Center</Button>
              </div>
            ) : (
              <div className="rounded-md bg-slate-50 p-5 text-sm leading-6 text-slate-600">Start with a campaign export or the included sample data.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
