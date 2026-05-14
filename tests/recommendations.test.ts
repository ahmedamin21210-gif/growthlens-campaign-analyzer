import { describe, expect, it } from "vitest";
import { analyzeCampaigns } from "../src/shared/kpiEngine";
import { defaultTargets, type CampaignRow } from "../src/shared/types";

describe("recommendation engine", () => {
  it("flags low CTR, high spend with zero conversions, and scaling winners", () => {
    const rows: CampaignRow[] = [
      { campaignName: "Scale Me", impressions: 10000, clicks: 700, spend: 400, conversions: 90, revenue: 6000, purchases: 80, leads: 10 },
      { campaignName: "Creative Problem", impressions: 20000, clicks: 60, spend: 300, conversions: 1, revenue: 20, purchases: 0, leads: 1 },
      { campaignName: "Pause Me", impressions: 15000, clicks: 150, spend: 900, conversions: 0, revenue: 0, purchases: 0, leads: 0 }
    ];
    const analysis = analyzeCampaigns(rows, defaultTargets);
    expect(analysis.recommendations.some((item) => item.issue === "Scaling opportunity")).toBe(true);
    expect(analysis.recommendations.some((item) => item.issue === "Low ad engagement")).toBe(true);
    expect(analysis.recommendations.some((item) => item.issue === "Wasted budget")).toBe(true);
  });
});
