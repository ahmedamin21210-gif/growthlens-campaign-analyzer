import type { ColumnDetectionResult, ColumnMapping, StandardField } from "./types";

const aliases: Record<StandardField, string[]> = {
  campaign_name: ["campaign", "campaign name", "campaign title", "campaign_name", "campaignname"],
  adset_name: ["ad set", "ad set name", "adset", "adset name", "adset_name", "ad group", "ad group name"],
  ad_name: ["ad", "ad name", "ad_name", "creative", "creative name"],
  date: ["date", "day", "reporting starts", "reporting date", "start date", "time period"],
  impressions: ["impressions", "views", "reach impressions", "reach_impressions", "served impressions"],
  clicks: ["clicks", "link clicks", "link_clicks", "all clicks", "outbound clicks", "website clicks"],
  spend: ["amount spent", "spend", "cost", "ad spend", "amount_spent", "cost usd", "media spend"],
  conversions: ["conversions", "results", "website conversions", "total conversions", "conv", "all conversions"],
  conversion_value: [
    "conversion value",
    "purchase value",
    "total conversion value",
    "sales value",
    "conv value",
    "conversion_value"
  ],
  revenue: ["revenue", "sales", "purchase value", "total conversion value", "conversion value"],
  purchases: ["purchases", "purchase", "orders", "transactions", "sales count"],
  leads: ["leads", "lead", "form fills", "contacts", "registrations"],
  ctr: ["ctr", "click through rate", "click-through rate", "link ctr"],
  cpc: ["cpc", "cost per click", "average cpc", "avg cpc"],
  cpm: ["cpm", "cost per 1000 impressions", "cost per mille", "average cpm"],
  cpa: ["cpa", "cost per action", "cost per conversion", "cost per result"],
  roas: ["roas", "return on ad spend", "purchase roas", "website purchase roas"],
  platform: ["platform", "source", "channel", "network", "ad platform"],
  objective: ["objective", "campaign objective", "optimization goal", "goal"],
  country: ["country", "location", "market", "region"],
  device: ["device", "device type", "placement device"],
  age: ["age", "age range", "age_range"],
  gender: ["gender", "sex"]
};

const requiredFields: StandardField[] = ["campaign_name", "impressions", "clicks", "spend"];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ");
}

function compact(value: string): string {
  return normalize(value).replace(/\s+/g, "");
}

function scoreHeader(field: StandardField, header: string): { confidence: number; reason: string } | null {
  const normalizedHeader = normalize(header);
  const compactHeader = compact(header);
  for (const alias of aliases[field]) {
    const normalizedAlias = normalize(alias);
    const compactAlias = compact(alias);
    if (normalizedHeader === normalizedAlias || compactHeader === compactAlias) {
      return { confidence: 0.98, reason: `Exact match for "${alias}"` };
    }
    if (normalizedHeader.includes(normalizedAlias) && normalizedAlias.length >= 4) {
      return { confidence: 0.82, reason: `Header contains "${alias}"` };
    }
    if (normalizedAlias.includes(normalizedHeader) && normalizedHeader.length >= 4) {
      return { confidence: 0.72, reason: `Close match to "${alias}"` };
    }
  }
  return null;
}

export function detectPlatform(headers: string[]): string | undefined {
  const joined = headers.map(normalize).join(" | ");
  if (joined.includes("amount spent") || joined.includes("link clicks") || joined.includes("ad set")) return "Meta Ads";
  if (joined.includes("avg cpc") || joined.includes("conv value") || joined.includes("campaign type")) return "Google Ads";
  if (joined.includes("video views") || joined.includes("tiktok") || joined.includes("complete payment")) return "TikTok Ads";
  if (joined.includes("linkedin") || joined.includes("company engagement")) return "LinkedIn Ads";
  if (joined.includes("snapchat") || joined.includes("swipes")) return "Snapchat Ads";
  return undefined;
}

export function detectColumns(headers: string[]): ColumnDetectionResult {
  const mapping: ColumnMapping = {};
  const candidates = [];
  const usedHeaders = new Set<string>();

  for (const field of Object.keys(aliases) as StandardField[]) {
    const scored = headers
      .map((header) => ({ header, score: scoreHeader(field, header) }))
      .filter((item): item is { header: string; score: { confidence: number; reason: string } } => item.score !== null)
      .sort((a, b) => b.score.confidence - a.score.confidence);

    const best = scored.find((item) => !usedHeaders.has(item.header));
    if (best && best.score.confidence >= 0.72) {
      mapping[field] = best.header;
      usedHeaders.add(best.header);
      candidates.push({
        field,
        column: best.header,
        confidence: best.score.confidence,
        reason: best.score.reason
      });
    }
  }

  if (mapping.conversion_value && !mapping.revenue) {
    mapping.revenue = mapping.conversion_value;
  }

  const missingRequiredFields = requiredFields.filter((field) => !mapping[field]);
  return {
    mapping,
    candidates,
    missingRequiredFields,
    detectedPlatform: detectPlatform(headers),
    headers
  };
}

export function mappingCompleteness(mapping: ColumnMapping): number {
  const required = requiredFields.filter((field) => mapping[field]).length / requiredFields.length;
  const recommended: StandardField[] = ["conversions", "revenue", "date"];
  const recommendedScore = recommended.filter((field) => mapping[field]).length / recommended.length;
  return Math.round((required * 0.75 + recommendedScore * 0.25) * 100);
}

export function requiredMappingFields(): StandardField[] {
  return [...requiredFields];
}
