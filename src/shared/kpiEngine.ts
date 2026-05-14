import { round, safeDivide, sum } from "./math";
import { calculateCampaignHealthScore, healthStatus, trendDirection } from "./scoringEngine";
import { buildRecommendations } from "./recommendations";
import { detectWastedSpend } from "./wastedSpend";
import type { AnalysisSummary, CampaignKPI, CampaignRow, MarketingTargets, OverallKPI, TrendPoint } from "./types";

type CampaignAggregate = {
  campaignName: string;
  rows: CampaignRow[];
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  leads: number;
  purchases: number;
};

function numberOrZero(value: number | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function aggregateRows(rows: CampaignRow[]): CampaignAggregate[] {
  const groups = new Map<string, CampaignAggregate>();
  for (const row of rows) {
    const group =
      groups.get(row.campaignName) ??
      ({
        campaignName: row.campaignName,
        rows: [],
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        leads: 0,
        purchases: 0
      } satisfies CampaignAggregate);
    group.rows.push(row);
    group.spend += numberOrZero(row.spend);
    group.impressions += numberOrZero(row.impressions);
    group.clicks += numberOrZero(row.clicks);
    group.conversions += numberOrZero(row.conversions);
    group.revenue += numberOrZero(row.revenue);
    group.leads += numberOrZero(row.leads);
    group.purchases += numberOrZero(row.purchases);
    groups.set(row.campaignName, group);
  }
  return [...groups.values()];
}

function deriveMetrics(group: CampaignAggregate, totals: CampaignAggregate): Omit<CampaignKPI, "healthScore" | "status" | "recommendedAction" | "wastedSpend" | "trendDirection"> {
  const ctr = safeDivide(group.clicks, group.impressions) ?? 0;
  const cpc = safeDivide(group.spend, group.clicks);
  const cpm = group.impressions ? (group.spend / group.impressions) * 1000 : null;
  const cpa = safeDivide(group.spend, group.conversions);
  const roas = safeDivide(group.revenue, group.spend);
  const conversionRate = safeDivide(group.conversions, group.clicks);
  const costPerLead = safeDivide(group.spend, group.leads);
  const costPerPurchase = safeDivide(group.spend, group.purchases);
  const averageOrderValue = safeDivide(group.revenue, group.purchases);

  return {
    campaignName: group.campaignName,
    spend: round(group.spend, 2) ?? 0,
    impressions: Math.round(group.impressions),
    clicks: Math.round(group.clicks),
    conversions: round(group.conversions, 2) ?? 0,
    revenue: round(group.revenue, 2) ?? 0,
    leads: round(group.leads, 2) ?? 0,
    purchases: round(group.purchases, 2) ?? 0,
    ctr: round(ctr) ?? 0,
    cpc: round(cpc, 2),
    cpm: round(cpm, 2),
    cpa: round(cpa, 2),
    roas: round(roas, 2),
    conversionRate: round(conversionRate),
    costPerLead: round(costPerLead, 2),
    costPerPurchase: round(costPerPurchase, 2),
    averageOrderValue: round(averageOrderValue, 2),
    spendShare: round(safeDivide(group.spend, totals.spend) ?? 0) ?? 0,
    revenueShare: round(safeDivide(group.revenue, totals.revenue) ?? 0) ?? 0,
    conversionShare: round(safeDivide(group.conversions, totals.conversions) ?? 0) ?? 0
  };
}

function recommendedAction(status: CampaignKPI["status"], wastedSpend: number, roas: number | null): string {
  if (wastedSpend > 0 && status === "Critical") return "Pause campaign";
  if (wastedSpend > 0) return "Reduce budget";
  if (status === "Excellent" && (roas ?? 0) > 0) return "Increase budget carefully";
  if (status === "Weak") return "Improve creative or landing page";
  if (status === "Critical") return "Fix tracking or pause";
  return "Monitor only";
}

function buildTrend(rows: CampaignRow[]): TrendPoint[] {
  const byDate = new Map<string, Omit<TrendPoint, "roas" | "cpa">>();
  for (const row of rows) {
    if (!row.date) continue;
    const current =
      byDate.get(row.date) ??
      ({
        date: row.date,
        spend: 0,
        revenue: 0,
        conversions: 0,
        clicks: 0,
        impressions: 0
      } satisfies Omit<TrendPoint, "roas" | "cpa">);
    current.spend += row.spend;
    current.revenue += row.revenue ?? 0;
    current.conversions += row.conversions ?? 0;
    current.clicks += row.clicks;
    current.impressions += row.impressions;
    byDate.set(row.date, current);
  }
  return [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((point) => ({
      ...point,
      spend: round(point.spend, 2) ?? 0,
      revenue: round(point.revenue, 2) ?? 0,
      conversions: round(point.conversions, 2) ?? 0,
      roas: round(safeDivide(point.revenue, point.spend), 2),
      cpa: round(safeDivide(point.spend, point.conversions), 2)
    }));
}

function overallFromCampaigns(campaigns: CampaignKPI[], wastedSpend: number, targets: MarketingTargets): OverallKPI {
  const totalSpend = sum(campaigns.map((campaign) => campaign.spend));
  const totalImpressions = sum(campaigns.map((campaign) => campaign.impressions));
  const totalClicks = sum(campaigns.map((campaign) => campaign.clicks));
  const totalConversions = sum(campaigns.map((campaign) => campaign.conversions));
  const totalRevenue = sum(campaigns.map((campaign) => campaign.revenue));
  const totalLeads = sum(campaigns.map((campaign) => campaign.leads));
  const totalPurchases = sum(campaigns.map((campaign) => campaign.purchases));
  const profitEstimate = targets.profitMargin ? totalRevenue * targets.profitMargin - totalSpend : null;

  return {
    totalSpend: round(totalSpend, 2) ?? 0,
    totalImpressions,
    totalClicks,
    totalConversions: round(totalConversions, 2) ?? 0,
    totalRevenue: round(totalRevenue, 2) ?? 0,
    totalLeads: round(totalLeads, 2) ?? 0,
    totalPurchases: round(totalPurchases, 2) ?? 0,
    ctr: round(safeDivide(totalClicks, totalImpressions) ?? 0) ?? 0,
    cpc: round(safeDivide(totalSpend, totalClicks), 2),
    cpm: totalImpressions ? round((totalSpend / totalImpressions) * 1000, 2) : null,
    cpa: round(safeDivide(totalSpend, totalConversions), 2),
    roas: round(safeDivide(totalRevenue, totalSpend), 2),
    conversionRate: round(safeDivide(totalConversions, totalClicks)),
    costPerLead: round(safeDivide(totalSpend, totalLeads), 2),
    costPerPurchase: round(safeDivide(totalSpend, totalPurchases), 2),
    averageOrderValue: round(safeDivide(totalRevenue, totalPurchases), 2),
    profitEstimate: round(profitEstimate, 2),
    wastedSpend: round(wastedSpend, 2) ?? 0,
    campaignCount: campaigns.length
  };
}

export function analyzeCampaigns(rows: CampaignRow[], targets: MarketingTargets): AnalysisSummary {
  const aggregates = aggregateRows(rows);
  const totals: CampaignAggregate = {
    campaignName: "All campaigns",
    rows,
    spend: sum(aggregates.map((campaign) => campaign.spend)),
    impressions: sum(aggregates.map((campaign) => campaign.impressions)),
    clicks: sum(aggregates.map((campaign) => campaign.clicks)),
    conversions: sum(aggregates.map((campaign) => campaign.conversions)),
    revenue: sum(aggregates.map((campaign) => campaign.revenue)),
    leads: sum(aggregates.map((campaign) => campaign.leads)),
    purchases: sum(aggregates.map((campaign) => campaign.purchases))
  };

  const derived = aggregates.map((aggregate) => deriveMetrics(aggregate, totals));
  const averages = {
    cpc: safeDivide(sum(derived.map((campaign) => campaign.cpc ?? 0)), derived.filter((campaign) => campaign.cpc !== null).length),
    cpa: safeDivide(sum(derived.map((campaign) => campaign.cpa ?? 0)), derived.filter((campaign) => campaign.cpa !== null).length),
    conversionRate: safeDivide(
      sum(derived.map((campaign) => campaign.conversionRate ?? 0)),
      derived.filter((campaign) => campaign.conversionRate !== null).length
    )
  };

  const baseCampaigns = derived.map((campaign) => {
    const healthScore = calculateCampaignHealthScore(campaign, targets, averages);
    return {
      ...campaign,
      healthScore,
      status: healthStatus(healthScore),
      recommendedAction: "Monitor only",
      wastedSpend: 0,
      trendDirection: trendDirection(aggregates.find((aggregate) => aggregate.campaignName === campaign.campaignName)?.rows ?? [])
    } satisfies CampaignKPI;
  });

  const wastedSpend = detectWastedSpend(baseCampaigns, targets);
  const wastedByCampaign = new Map(wastedSpend.map((finding) => [finding.campaignName, finding.amount]));
  const campaigns = baseCampaigns
    .map((campaign) => {
      const wasted = round(wastedByCampaign.get(campaign.campaignName) ?? 0, 2) ?? 0;
      return {
        ...campaign,
        wastedSpend: wasted,
        recommendedAction: recommendedAction(campaign.status, wasted, campaign.roas)
      };
    })
    .sort((a, b) => b.spend - a.spend);

  const recommendations = buildRecommendations(campaigns, wastedSpend, targets);
  const topCampaigns = [...campaigns]
    .filter((campaign) => campaign.spend > 0)
    .sort((a, b) => b.healthScore - a.healthScore || (b.roas ?? 0) - (a.roas ?? 0))
    .slice(0, 5);
  const worstCampaigns = [...campaigns]
    .filter((campaign) => campaign.spend > 0)
    .sort((a, b) => b.wastedSpend - a.wastedSpend || a.healthScore - b.healthScore)
    .slice(0, 5);
  const totalWasted = sum(wastedSpend.map((finding) => finding.amount));

  return {
    overall: overallFromCampaigns(campaigns, totalWasted, targets),
    campaigns,
    trend: buildTrend(rows),
    wastedSpend,
    recommendations,
    topCampaigns,
    worstCampaigns
  };
}
