import { describe, expect, it } from "vitest";
import { buildReportHtml } from "../src/main/reportHtml";
import { defaultSettings, type AnalysisSummary } from "../src/shared/types";

describe("campaign report HTML", () => {
  it("escapes user-controlled report content", () => {
    const analysis: AnalysisSummary = {
      overall: {
        totalSpend: 10,
        totalImpressions: 100,
        totalClicks: 10,
        totalConversions: 1,
        totalRevenue: 20,
        totalLeads: 0,
        totalPurchases: 1,
        ctr: 0.1,
        cpc: 1,
        cpm: 100,
        cpa: 10,
        roas: 2,
        conversionRate: 0.1,
        costPerLead: null,
        costPerPurchase: 10,
        averageOrderValue: 20,
        profitEstimate: null,
        wastedSpend: 0,
        campaignCount: 1
      },
      campaigns: [],
      trend: [],
      wastedSpend: [],
      recommendations: [],
      topCampaigns: [],
      worstCampaigns: []
    };
    const html = buildReportHtml({
      title: "<script>alert(1)</script>",
      generatedAt: "2026-05-09",
      analysis,
      branding: { ...defaultSettings.branding, companyName: "<img src=x onerror=alert(1)>", primaryColor: "red" }
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain("background: #1E1B4B");
  });
});
