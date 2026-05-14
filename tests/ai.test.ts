import { describe, expect, it } from "vitest";
import { buildAIContextSummary, buildChatPrompt, parseAIResponse, parseAIResponseV1 } from "../src/shared/ai";
import { analyzeCampaigns } from "../src/shared/kpiEngine";
import { defaultTargets } from "../src/shared/types";

const rows = [
  {
    campaignName: "Leak Candidate",
    impressions: 1000,
    clicks: 20,
    spend: 200,
    conversions: 0,
    revenue: 0,
    platform: "PRIVATE_PLATFORM_RAW",
    date: "2026-05-01"
  },
  {
    campaignName: "Scale Winner",
    impressions: 2000,
    clicks: 120,
    spend: 300,
    conversions: 20,
    revenue: 1800,
    date: "2026-05-02"
  }
];
const analysis = analyzeCampaigns(rows, defaultTargets);

describe("AI response parsing", () => {
  it("parses raw and fenced JSON", () => {
    const raw = parseAIResponse('{"executive_summary":"Good","main_problems":[],"main_opportunities":[],"campaign_recommendations":[],"budget_recommendations":[],"next_steps":["Review"]}');
    expect(raw.executive_summary).toBe("Good");
    const fenced = parseAIResponse('```json\n{"executive_summary":"Fine","main_problems":["A"],"main_opportunities":[],"campaign_recommendations":[],"budget_recommendations":[],"next_steps":[]}\n```');
    expect(fenced.main_problems).toEqual(["A"]);
  });

  it("throws for malformed JSON so callers can use fallback insights", () => {
    expect(() => parseAIResponse("not json")).toThrow();
  });

  it("normalizes V1 JSON with missing optional sections", () => {
    const parsed = parseAIResponseV1('{"executive_summary":"Done","risks":["Leak"],"growth_opportunities":["Scale"],"next_steps":["Move budget"]}');
    expect(parsed.risks).toEqual(["Leak"]);
    expect(parsed.main_problems).toEqual(["Leak"]);
    expect(parsed.growth_opportunities).toEqual(["Scale"]);
    expect(parsed.key_findings).toEqual([]);
  });
});

describe("AI context and chat prompts", () => {
  it("excludes raw cleaned rows by default", () => {
    const context = buildAIContextSummary({ analysis, targets: defaultTargets, cleanedRows: rows, allowDetailedAiData: false });
    expect(context.detailedRowsIncluded).toBe(false);
    expect(context.detailedRows).toBeUndefined();
    expect(JSON.stringify(context)).not.toContain("PRIVATE_PLATFORM_RAW");
  });

  it("includes detailed rows only when explicitly allowed", () => {
    const context = buildAIContextSummary({ analysis, targets: defaultTargets, cleanedRows: rows, allowDetailedAiData: true });
    expect(context.detailedRowsIncluded).toBe(true);
    expect(JSON.stringify(context.detailedRows)).toContain("PRIVATE_PLATFORM_RAW");
  });

  it("builds chat prompts from allowed campaign context", () => {
    const prompt = buildChatPrompt({
      question: "Where should I move budget?",
      analysis,
      targets: defaultTargets,
      allowDetailedAiData: false,
      cleanedRows: rows
    });
    expect(prompt.system).toContain("Answer only from the provided campaign analysis context");
    expect(prompt.user).toContain("Where should I move budget?");
    expect(prompt.user).not.toContain("PRIVATE_PLATFORM_RAW");
  });
});
