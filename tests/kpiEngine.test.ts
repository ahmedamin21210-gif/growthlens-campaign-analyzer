import { describe, expect, it } from "vitest";
import { analyzeCampaigns } from "../src/shared/kpiEngine";
import { defaultTargets, type CampaignRow } from "../src/shared/types";

const rows: CampaignRow[] = [
  { campaignName: "Winner", date: "2026-04-01", impressions: 10000, clicks: 600, spend: 300, conversions: 60, revenue: 3600, leads: 10, purchases: 50 },
  { campaignName: "Waste", date: "2026-04-01", impressions: 12000, clicks: 80, spend: 800, conversions: 0, revenue: 0, leads: 0, purchases: 0 },
  { campaignName: "Average", date: "2026-04-02", impressions: 8000, clicks: 120, spend: 240, conversions: 4, revenue: 300, leads: 1, purchases: 3 }
];

describe("kpi engine", () => {
  it("calculates core KPIs and avoids invalid division output", () => {
    const analysis = analyzeCampaigns(rows, defaultTargets);
    expect(analysis.overall.totalSpend).toBe(1340);
    expect(analysis.overall.ctr).toBeCloseTo(0.0267, 3);
    expect(analysis.overall.roas).toBeCloseTo(2.91, 2);
    expect(analysis.campaigns.find((campaign) => campaign.campaignName === "Waste")?.cpa).toBeNull();
    expect(JSON.stringify(analysis)).not.toContain("Infinity");
    expect(JSON.stringify(analysis)).not.toContain("NaN");
  });

  it("classifies strong and weak campaign health", () => {
    const analysis = analyzeCampaigns(rows, defaultTargets);
    expect(analysis.campaigns.find((campaign) => campaign.campaignName === "Winner")?.status).toBe("Excellent");
    expect(analysis.campaigns.find((campaign) => campaign.campaignName === "Waste")?.status).toBe("Critical");
  });
});
