import type { CampaignKPI, MarketingTargets, WastedSpendFinding } from "./types";

function severityFor(amount: number, spend: number): WastedSpendFinding["severity"] {
  const ratio = spend > 0 ? amount / spend : 0;
  if (ratio >= 0.75) return "critical";
  if (ratio >= 0.45) return "high";
  if (ratio >= 0.2) return "medium";
  return "low";
}

export function detectWastedSpend(campaigns: CampaignKPI[], targets: MarketingTargets): WastedSpendFinding[] {
  const averageSpend = campaigns.reduce((total, campaign) => total + campaign.spend, 0) / Math.max(campaigns.length, 1);
  const averageCpc =
    campaigns.reduce((total, campaign) => total + (campaign.cpc ?? 0), 0) / Math.max(campaigns.filter((campaign) => campaign.cpc).length, 1);
  const averageCpa =
    campaigns.reduce((total, campaign) => total + (campaign.cpa ?? 0), 0) / Math.max(campaigns.filter((campaign) => campaign.cpa).length, 1);
  const averageConversionRate =
    campaigns.reduce((total, campaign) => total + (campaign.conversionRate ?? 0), 0) /
    Math.max(campaigns.filter((campaign) => campaign.conversionRate !== null).length, 1);

  const findings: WastedSpendFinding[] = [];
  for (const campaign of campaigns) {
    const reasons: string[] = [];
    let wastedAmount = 0;
    let suggestedAction: WastedSpendFinding["suggestedAction"] = "Monitor only";

    if (campaign.spend >= averageSpend * 0.7 && campaign.conversions === 0) {
      reasons.push("High spend with zero conversions");
      wastedAmount = Math.max(wastedAmount, campaign.spend);
      suggestedAction = "Pause campaign";
    }

    if (campaign.ctr < targets.minimumCtr) {
      reasons.push(`CTR below ${(targets.minimumCtr * 100).toFixed(1)}% target`);
      wastedAmount = Math.max(wastedAmount, campaign.spend * 0.35);
      suggestedAction = suggestedAction === "Pause campaign" ? suggestedAction : "Improve creative";
    }

    const maxCpc = targets.maximumCpc ?? averageCpc * 1.35;
    if (campaign.cpc !== null && maxCpc > 0 && campaign.cpc > maxCpc) {
      reasons.push("CPC is materially higher than target or account average");
      wastedAmount = Math.max(wastedAmount, campaign.spend * Math.min(0.6, 1 - maxCpc / campaign.cpc));
      suggestedAction = suggestedAction === "Pause campaign" ? suggestedAction : "Change targeting";
    }

    const targetCpa = targets.targetCpa ?? (averageCpa > 0 ? averageCpa * 1.35 : null);
    if (campaign.cpa !== null && targetCpa && campaign.cpa > targetCpa) {
      reasons.push("CPA is above target or account average");
      wastedAmount = Math.max(wastedAmount, campaign.spend * Math.min(0.65, 1 - targetCpa / campaign.cpa));
      suggestedAction = suggestedAction === "Pause campaign" ? suggestedAction : "Reduce budget";
    }

    if (campaign.roas !== null && campaign.roas < targets.targetRoas) {
      reasons.push(`ROAS below ${targets.targetRoas.toFixed(2)} target`);
      wastedAmount = Math.max(wastedAmount, campaign.spend * Math.min(0.8, 1 - campaign.roas / targets.targetRoas));
      suggestedAction = suggestedAction === "Pause campaign" ? suggestedAction : "Reduce budget";
    }

    const minimumConversionRate = Math.max(targets.minimumConversionRate, averageConversionRate * 0.75);
    if (campaign.clicks > 0 && (campaign.conversionRate ?? 0) < minimumConversionRate) {
      reasons.push("Conversion rate is below target or account average");
      wastedAmount = Math.max(wastedAmount, campaign.spend * 0.25);
      suggestedAction = suggestedAction === "Pause campaign" ? suggestedAction : "Improve landing page";
    }

    if (reasons.length > 0) {
      const amount = Math.min(campaign.spend, Math.max(0, wastedAmount));
      findings.push({
        campaignName: campaign.campaignName,
        amount,
        reasons,
        severity: severityFor(amount, campaign.spend),
        suggestedAction
      });
    }
  }

  return findings.sort((a, b) => b.amount - a.amount);
}
