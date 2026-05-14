import { describe, expect, it } from "vitest";
import { validateAiChatRequest, validatePdfExportPayload, validateSettings } from "../src/shared/campaignValidation";
import { defaultSettings, type AnalysisSummary } from "../src/shared/types";

const emptyAnalysis: AnalysisSummary = {
  overall: {
    totalSpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalRevenue: 0,
    totalLeads: 0,
    totalPurchases: 0,
    ctr: 0,
    cpc: null,
    cpm: null,
    cpa: null,
    roas: null,
    conversionRate: null,
    costPerLead: null,
    costPerPurchase: null,
    averageOrderValue: null,
    profitEstimate: null,
    wastedSpend: 0,
    campaignCount: 0
  },
  campaigns: [],
  trend: [],
  wastedSpend: [],
  recommendations: [],
  topCampaigns: [],
  worstCampaigns: []
};

describe("campaign validation", () => {
  it("defaults AI to disabled and validates numeric target ranges", () => {
    const settings = validateSettings({ ...defaultSettings, aiProvider: "openai", targets: { ...defaultSettings.targets, minimumCtr: 0.02 } });
    expect(settings.aiProvider).toBe("openai");
    expect(settings.targets.minimumCtr).toBe(0.02);
    expect(() => validateSettings({ ...defaultSettings, targets: { ...defaultSettings.targets, minimumCtr: 2 } })).toThrow(/highlighted fields/i);
  });

  it("sanitizes invalid report colors", () => {
    const payload = validatePdfExportPayload({
      title: "Brief",
      analysis: emptyAnalysis,
      branding: { ...defaultSettings.branding, primaryColor: "url(javascript:alert(1))" }
    });
    expect(payload.branding.primaryColor).toBe("#1E1B4B");
  });

  it("rejects invalid AI chat requests", () => {
    expect(() => validateAiChatRequest({ question: "", analysis: emptyAnalysis, targets: defaultSettings.targets })).toThrow(/highlighted fields/i);
    expect(() => validateAiChatRequest({ question: "x".repeat(4001), analysis: emptyAnalysis, targets: defaultSettings.targets })).toThrow(/highlighted fields/i);
    expect(() => validateAiChatRequest({ question: "What should I do?", targets: defaultSettings.targets })).toThrow(/highlighted fields/i);
  });
});
