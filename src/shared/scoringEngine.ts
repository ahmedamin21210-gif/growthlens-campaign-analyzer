import { clamp, safeDivide } from "./math";
import type { CampaignHealthStatus, CampaignKPI, MarketingTargets } from "./types";

export function healthStatus(score: number): CampaignHealthStatus {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Average";
  if (score >= 30) return "Weak";
  return "Critical";
}

function scoreHigher(value: number | null, target: number, cap = 2): number {
  if (value === null || target <= 0) return 0;
  return clamp((value / target) * 100, 0, 100 * cap) / cap;
}

function scoreLower(value: number | null, target: number | null | undefined): number {
  if (value === null || !target || target <= 0) return 50;
  return clamp((target / value) * 100, 0, 100);
}

export function calculateCampaignHealthScore(
  campaign: Omit<CampaignKPI, "healthScore" | "status" | "recommendedAction" | "wastedSpend" | "trendDirection">,
  targets: MarketingTargets,
  averages: { cpc: number | null; cpa: number | null; conversionRate: number | null }
): number {
  const cpaTarget = targets.targetCpa ?? averages.cpa;
  const cpcTarget = targets.maximumCpc ?? averages.cpc;
  const spendEfficiency = campaign.conversions > 0 || (campaign.roas ?? 0) >= targets.targetRoas ? 90 : campaign.clicks > 0 ? 45 : 20;

  const roasExists = campaign.roas !== null && campaign.revenue > 0;
  if (roasExists) {
    const score =
      scoreHigher(campaign.roas, targets.targetRoas) * 0.35 +
      scoreLower(campaign.cpa, cpaTarget) * 0.2 +
      scoreHigher(campaign.ctr, targets.minimumCtr) * 0.15 +
      scoreHigher(campaign.conversionRate, targets.minimumConversionRate) * 0.15 +
      spendEfficiency * 0.15;
    return Math.round(clamp(score, 0, 100));
  }

  const conversionBaseline = targets.minimumConversionRate || averages.conversionRate || 0.02;
  const score =
    scoreHigher(campaign.ctr, targets.minimumCtr) * 0.3 +
    scoreLower(campaign.cpc, cpcTarget) * 0.25 +
    scoreHigher(campaign.conversionRate, conversionBaseline) * 0.25 +
    spendEfficiency * 0.2;
  return Math.round(clamp(score, 0, 100));
}

export function trendDirection(points: Array<{ date?: string; spend: number; revenue?: number; conversions?: number }>): "up" | "down" | "flat" | "unknown" {
  const dated = points.filter((point) => point.date).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (dated.length < 4) return "unknown";
  const midpoint = Math.floor(dated.length / 2);
  const first = dated.slice(0, midpoint);
  const second = dated.slice(midpoint);
  const firstScore = safeDivide(
    first.reduce((total, row) => total + (row.revenue ?? row.conversions ?? 0), 0),
    first.reduce((total, row) => total + row.spend, 0)
  );
  const secondScore = safeDivide(
    second.reduce((total, row) => total + (row.revenue ?? row.conversions ?? 0), 0),
    second.reduce((total, row) => total + row.spend, 0)
  );
  if (firstScore === null || secondScore === null) return "unknown";
  if (secondScore > firstScore * 1.1) return "up";
  if (secondScore < firstScore * 0.9) return "down";
  return "flat";
}
