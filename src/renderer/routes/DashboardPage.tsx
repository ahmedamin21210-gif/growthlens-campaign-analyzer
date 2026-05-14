import { AlertTriangle, DollarSign, Eye, MousePointerClick, Percent, ShoppingCart, Target, TrendingUp, WalletCards } from "lucide-react";
import { BudgetChart } from "../components/dashboard/BudgetChart";
import { FunnelChart } from "../components/dashboard/FunnelChart";
import { KPICard } from "../components/dashboard/KPICard";
import { PerformanceChart } from "../components/dashboard/PerformanceChart";
import { HealthScoreBadge } from "../components/campaigns/HealthScoreBadge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { useCampaign } from "../state/CampaignContext";
import { money, numberCompact, percent } from "../lib/utils";
import { useNavigate } from "react-router-dom";

export function DashboardPage() {
  const navigate = useNavigate();
  const { analysis, settings } = useCampaign();
  if (!analysis) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <CardTitle>No Command Center yet</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Upload and map campaign data to populate the GrowthLens Command Center.</p>
          </div>
          <Button onClick={() => navigate("/upload")}>Upload Campaign Data</Button>
        </CardContent>
      </Card>
    );
  }
  const kpi = analysis.overall;
  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-executive">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
              Command Center
            </div>
            <h2 className="font-display text-3xl font-bold tracking-normal text-brand-navy">Revenue decision dashboard</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Executive KPI view, Growth Scores, Leak Detector alerts, and campaign-level action signals.
            </p>
          </div>
          <Button onClick={() => navigate("/insights")}>View Action Plan</Button>
        </div>
      </section>
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Total Spend" value={money(kpi.totalSpend, settings.defaultCurrency)} icon={DollarSign} />
        <KPICard label="Revenue" value={money(kpi.totalRevenue, settings.defaultCurrency)} icon={WalletCards} tone="green" />
        <KPICard label="ROAS" value={kpi.roas?.toFixed(2) ?? "-"} icon={TrendingUp} tone="blue" />
        <KPICard label="Leak Detector" value={money(kpi.wastedSpend, settings.defaultCurrency)} icon={AlertTriangle} tone="red" />
        <KPICard label="Impressions" value={numberCompact(kpi.totalImpressions)} icon={Eye} tone="blue" />
        <KPICard label="Clicks" value={numberCompact(kpi.totalClicks)} icon={MousePointerClick} />
        <KPICard label="CTR" value={percent(kpi.ctr)} icon={Percent} tone="amber" />
        <KPICard label="Conversions" value={numberCompact(kpi.totalConversions)} icon={Target} tone="green" />
        <KPICard label="CPC" value={money(kpi.cpc, settings.defaultCurrency)} icon={DollarSign} />
        <KPICard label="CPA" value={money(kpi.cpa, settings.defaultCurrency)} icon={ShoppingCart} tone="amber" />
        <KPICard label="Conversion Rate" value={percent(kpi.conversionRate)} icon={Percent} tone="green" />
        <KPICard label="Campaigns Analyzed" value={String(kpi.campaignCount)} icon={Target} tone="blue" />
      </div>
      <PerformanceChart data={analysis.trend} />
      <div className="grid grid-cols-2 gap-6">
        <BudgetChart campaigns={analysis.campaigns} metric="spend" />
        <BudgetChart campaigns={analysis.campaigns} metric="revenue" />
      </div>
      <div className="grid grid-cols-[1fr_1fr_420px] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Growth leaders</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {analysis.topCampaigns.map((campaign) => (
              <div key={campaign.campaignName} className="rounded-2xl border border-brand-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-semibold text-slate-900">{campaign.campaignName}</div>
                  <HealthScoreBadge score={campaign.healthScore} status={campaign.status} />
                </div>
                <div className="mt-2 text-xs text-slate-500">ROAS {campaign.roas?.toFixed(2) ?? "-"} · CPA {money(campaign.cpa)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Leak Detector</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {analysis.worstCampaigns.map((campaign) => (
              <div key={campaign.campaignName} className="rounded-2xl border border-brand-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-semibold text-slate-900">{campaign.campaignName}</div>
                  <span className="text-xs font-semibold text-red-700">{money(campaign.wastedSpend)} leaked</span>
                </div>
                <div className="mt-2 text-xs text-slate-500">{campaign.recommendedAction}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <FunnelChart overall={analysis.overall} />
      </div>
    </div>
  );
}
