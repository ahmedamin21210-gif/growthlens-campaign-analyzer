import type { CampaignKPI, MarketingTargets, Recommendation, WastedSpendFinding } from "./types";

function money(value: number): string {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function buildRecommendations(
  campaigns: CampaignKPI[],
  wastedSpend: WastedSpendFinding[],
  targets: MarketingTargets
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const wastedByCampaign = new Map(wastedSpend.map((finding) => [finding.campaignName, finding]));

  for (const campaign of campaigns) {
    const wasted = wastedByCampaign.get(campaign.campaignName);
    if (wasted && wasted.reasons.includes("High spend with zero conversions")) {
      recommendations.push({
        campaignName: campaign.campaignName,
        issue: "Wasted budget",
        evidence: `${money(campaign.spend)} spent with zero conversions.`,
        severity: "critical",
        action: "Pause or sharply reduce this campaign until tracking, offer, and landing page are checked.",
        reason: "Spend is not producing measurable outcomes.",
        expectedImpact: "Stops budget leakage and frees spend for campaigns with evidence of demand."
      });
      continue;
    }

    if (campaign.ctr < targets.minimumCtr) {
      recommendations.push({
        campaignName: campaign.campaignName,
        issue: "Low ad engagement",
        evidence: `CTR is ${(campaign.ctr * 100).toFixed(2)}%, below the ${(targets.minimumCtr * 100).toFixed(2)}% target.`,
        severity: campaign.ctr < targets.minimumCtr / 2 ? "high" : "medium",
        action: "Test new creative hooks, headlines, formats, and offers.",
        reason: "The audience is seeing the ad but not clicking at a healthy rate.",
        expectedImpact: "Improves traffic quality and can lower CPC through better relevance."
      });
    }

    const cpcTarget = targets.maximumCpc;
    if (campaign.cpc !== null && cpcTarget && campaign.cpc > cpcTarget) {
      recommendations.push({
        campaignName: campaign.campaignName,
        issue: "Expensive traffic",
        evidence: `CPC is ${money(campaign.cpc)}, above the ${money(cpcTarget)} target.`,
        severity: "medium",
        action: "Refine targeting, exclude weak segments, and test broader or higher-intent audiences.",
        reason: "Traffic is costing too much before it reaches the conversion step.",
        expectedImpact: "Reduces acquisition cost and increases room for profitable scaling."
      });
    }

    if (campaign.clicks > 50 && (campaign.conversionRate ?? 0) < targets.minimumConversionRate) {
      recommendations.push({
        campaignName: campaign.campaignName,
        issue: "Post-click conversion issue",
        evidence: `Conversion rate is ${((campaign.conversionRate ?? 0) * 100).toFixed(2)}% after ${campaign.clicks.toLocaleString()} clicks.`,
        severity: "high",
        action: "Improve landing page clarity, speed, trust signals, and offer alignment.",
        reason: "Clicks are arriving, but the destination is not converting enough users.",
        expectedImpact: "Raises conversion volume without needing more media spend."
      });
    }

    if (campaign.roas !== null && campaign.roas < targets.targetRoas && campaign.spend > 0) {
      recommendations.push({
        campaignName: campaign.campaignName,
        issue: "ROAS below target",
        evidence: `ROAS is ${campaign.roas.toFixed(2)} versus a ${targets.targetRoas.toFixed(2)} target.`,
        severity: campaign.roas < targets.targetRoas * 0.5 ? "high" : "medium",
        action: "Reduce budget, improve offer economics, or retarget warmer audiences.",
        reason: "Revenue is not keeping pace with spend.",
        expectedImpact: "Protects profitability and shifts spend toward campaigns with stronger return."
      });
    }

    if ((campaign.roas ?? 0) >= targets.targetRoas * 1.25 && campaign.healthScore >= 80) {
      recommendations.push({
        campaignName: campaign.campaignName,
        issue: "Scaling opportunity",
        evidence: `ROAS is ${campaign.roas?.toFixed(2)} with a ${campaign.healthScore}/100 Growth Score.`,
        severity: "low",
        action: "Increase budget carefully by 10-20% and monitor CPA, ROAS, and conversion rate.",
        reason: "The campaign is outperforming targets with healthy efficiency.",
        expectedImpact: "Captures more revenue while controlling efficiency risk."
      });
    }
  }

  return recommendations.sort((a, b) => {
    const rank = { critical: 4, high: 3, medium: 2, low: 1 };
    return rank[b.severity] - rank[a.severity];
  });
}
