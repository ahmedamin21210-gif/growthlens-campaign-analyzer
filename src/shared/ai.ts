import type {
  AIChatMessage,
  AIChatRequest,
  AIContextSummary,
  AIInsightResponse,
  AIInsightResponseV1,
  AISeverity,
  AnalysisSummary,
  CampaignRow,
  MarketingTargets,
  Recommendation
} from "./types";

export type AIInsightPayload = {
  targets: MarketingTargets;
  analysis: AnalysisSummary;
  cleanedRows?: CampaignRow[];
  allowDetailedAiData?: boolean;
};

function textArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

function severity(value: unknown): AISeverity {
  return value === "critical" || value === "high" || value === "medium" || value === "low" ? value : "medium";
}

function titleFromRecommendation(recommendation: Recommendation): string {
  return `${recommendation.issue}${recommendation.campaignName ? `: ${recommendation.campaignName}` : ""}`;
}

function trendDirection(analysis: AnalysisSummary): AIContextSummary["trendSummary"]["direction"] {
  const first = analysis.trend[0];
  const last = analysis.trend[analysis.trend.length - 1];
  if (!first || !last || first.date === last.date) return "unknown";
  if (last.revenue > first.revenue || last.conversions > first.conversions) return "up";
  if (last.revenue < first.revenue || last.conversions < first.conversions) return "down";
  return "flat";
}

export function buildAIContextSummary(payload: AIInsightPayload): AIContextSummary {
  const { analysis, targets } = payload;
  const allowDetailedAiData = Boolean(payload.allowDetailedAiData);
  const firstTrend = analysis.trend[0];
  const lastTrend = analysis.trend[analysis.trend.length - 1];

  return {
    targets,
    overallKPIs: analysis.overall,
    topCampaigns: analysis.topCampaigns.slice(0, 8).map((campaign) => ({
      campaignName: campaign.campaignName,
      spend: campaign.spend,
      revenue: campaign.revenue,
      conversions: campaign.conversions,
      roas: campaign.roas,
      cpa: campaign.cpa,
      ctr: campaign.ctr,
      conversionRate: campaign.conversionRate,
      healthScore: campaign.healthScore,
      recommendedAction: campaign.recommendedAction
    })),
    worstCampaigns: analysis.worstCampaigns.slice(0, 8).map((campaign) => ({
      campaignName: campaign.campaignName,
      spend: campaign.spend,
      revenue: campaign.revenue,
      conversions: campaign.conversions,
      roas: campaign.roas,
      cpa: campaign.cpa,
      ctr: campaign.ctr,
      conversionRate: campaign.conversionRate,
      healthScore: campaign.healthScore,
      wastedSpend: campaign.wastedSpend,
      recommendedAction: campaign.recommendedAction
    })),
    campaignSummaries: analysis.campaigns.slice(0, allowDetailedAiData ? 100 : 40).map((campaign) => ({
      campaignName: campaign.campaignName,
      spend: campaign.spend,
      revenue: campaign.revenue,
      conversions: campaign.conversions,
      roas: campaign.roas,
      cpa: campaign.cpa,
      ctr: campaign.ctr,
      conversionRate: campaign.conversionRate,
      healthScore: campaign.healthScore,
      status: campaign.status,
      recommendedAction: campaign.recommendedAction,
      wastedSpend: campaign.wastedSpend
    })),
    recommendations: analysis.recommendations.slice(0, 30),
    wastedSpend: analysis.wastedSpend.slice(0, 20),
    trendSummary: {
      pointCount: analysis.trend.length,
      firstDate: firstTrend?.date,
      lastDate: lastTrend?.date,
      firstSpend: firstTrend?.spend,
      lastSpend: lastTrend?.spend,
      firstRevenue: firstTrend?.revenue,
      lastRevenue: lastTrend?.revenue,
      direction: trendDirection(analysis)
    },
    detailedRowsIncluded: allowDetailedAiData,
    detailedRows: allowDetailedAiData ? payload.cleanedRows?.slice(0, 500) : undefined
  };
}

export function buildInsightPromptV1(payload: AIInsightPayload): string {
  const context = buildAIContextSummary(payload);
  return `You are GrowthLens AI, an expert performance marketing analyst.

Analyze the campaign performance context below.

Rules:
- Only use the provided data.
- Do not invent numbers, dates, campaigns, or platform details.
- If evidence is missing, say what is unknown.
- Be direct, practical, and executive-ready.
- Focus on revenue decisions, budget movement, risk control, and next actions.
- Return valid JSON only. No markdown.

Campaign analysis context:
${JSON.stringify(context, null, 2)}

Return this exact JSON structure:
{
  "executive_summary": "",
  "key_findings": [
    {
      "title": "",
      "description": "",
      "severity": "low | medium | high | critical",
      "evidence": ""
    }
  ],
  "growth_opportunities": [],
  "risks": [],
  "budget_actions": [
    {
      "campaign": "",
      "current_spend": 0,
      "recommended_action": "",
      "reason": "",
      "priority": "low | medium | high | critical"
    }
  ],
  "campaign_recommendations": [
    {
      "campaign": "",
      "problem": "",
      "action": "",
      "expected_impact": "",
      "priority": "low | medium | high | critical",
      "evidence": ""
    }
  ],
  "next_steps": [],
  "audit_note": ""
}`;
}

export const buildInsightPrompt = buildInsightPromptV1;

export function fallbackInsightsV1(analysis: AnalysisSummary, error?: string): AIInsightResponseV1 {
  const wasted = analysis.overall.wastedSpend;
  const top = analysis.topCampaigns[0];
  const worst = analysis.worstCampaigns[0];
  const risks = worst ? [`${worst.campaignName} needs attention with a ${worst.healthScore}/100 Growth Score.`] : [];
  const opportunities = top ? [`${top.campaignName} is the strongest campaign with a ${top.healthScore}/100 Growth Score.`] : [];
  const keyFindings = analysis.recommendations.slice(0, 6).map((recommendation) => ({
    title: titleFromRecommendation(recommendation),
    description: recommendation.action,
    severity: recommendation.severity,
    evidence: recommendation.evidence
  }));

  return {
    executive_summary: `Analyzed ${analysis.overall.campaignCount} campaigns with $${analysis.overall.totalSpend.toLocaleString()} in spend. ${
      wasted > 0 ? `Estimated leaked spend is $${wasted.toLocaleString()}.` : "No major leaked spend was detected by the rule engine."
    }`,
    key_findings: keyFindings,
    growth_opportunities: opportunities,
    risks,
    budget_actions: analysis.wastedSpend.slice(0, 5).map((finding) => ({
      campaign: finding.campaignName,
      current_spend: finding.amount,
      recommended_action: finding.suggestedAction,
      reason: finding.reasons.join("; "),
      priority: finding.severity
    })),
    campaign_recommendations: analysis.recommendations.slice(0, 8).map((recommendation) => ({
      campaign: recommendation.campaignName,
      problem: recommendation.issue,
      action: recommendation.action,
      expected_impact: recommendation.expectedImpact,
      priority: recommendation.severity,
      evidence: recommendation.evidence
    })),
    next_steps: [
      "Review critical and high-severity Action Plan items first.",
      "Move budget away from Leak Detector campaigns and toward campaigns with strong Growth Scores.",
      "Retest creative, targeting, and landing pages where CTR or conversion rate is below target."
    ],
    audit_note: error
      ? `AI analysis was unavailable, so GrowthLens used deterministic KPI and rules-based analysis. Reason: ${error}`
      : "This Decision Panel was generated from deterministic KPI and rules-based analysis. AI can enhance it when configured.",
    generated_at: new Date().toISOString(),
    provider: "disabled",
    fallback: true,
    error,
    main_problems: risks,
    main_opportunities: opportunities,
    budget_recommendations: analysis.wastedSpend.slice(0, 5).map((finding) => ({
      campaign: finding.campaignName,
      current_wasted_spend: finding.amount,
      recommended_action: finding.suggestedAction,
      reason: finding.reasons.join("; ")
    }))
  };
}

export const fallbackInsights = fallbackInsightsV1;

export function parseAIResponseV1(text: string): AIInsightResponseV1 {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : trimmed).trim();
  const parsed = JSON.parse(candidate) as Record<string, unknown>;
  const risks = textArray(parsed.risks ?? parsed.main_problems);
  const opportunities = textArray(parsed.growth_opportunities ?? parsed.main_opportunities);

  return {
    executive_summary: String(parsed.executive_summary ?? ""),
    key_findings: Array.isArray(parsed.key_findings)
      ? parsed.key_findings.map((item) => {
          const finding = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          return {
            title: String(finding.title ?? "Campaign finding"),
            description: String(finding.description ?? ""),
            severity: severity(finding.severity),
            evidence: String(finding.evidence ?? "")
          };
        })
      : [],
    growth_opportunities: opportunities,
    risks,
    budget_actions: Array.isArray(parsed.budget_actions)
      ? parsed.budget_actions.map((item) => {
          const action = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          return {
            campaign: action.campaign === undefined ? undefined : String(action.campaign),
            current_spend: typeof action.current_spend === "number" ? action.current_spend : undefined,
            recommended_action: String(action.recommended_action ?? ""),
            reason: String(action.reason ?? ""),
            priority: severity(action.priority)
          };
        })
      : [],
    campaign_recommendations: Array.isArray(parsed.campaign_recommendations)
      ? parsed.campaign_recommendations.map((item) => {
          const recommendation = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          return {
            campaign: recommendation.campaign === undefined ? undefined : String(recommendation.campaign),
            problem: String(recommendation.problem ?? recommendation.issue ?? ""),
            action: String(recommendation.action ?? ""),
            expected_impact: String(recommendation.expected_impact ?? recommendation.expectedImpact ?? ""),
            priority: severity(recommendation.priority ?? recommendation.severity),
            evidence: recommendation.evidence === undefined ? undefined : String(recommendation.evidence)
          };
        })
      : [],
    next_steps: textArray(parsed.next_steps),
    audit_note: String(parsed.audit_note ?? "AI output was parsed and normalized by GrowthLens."),
    main_problems: risks,
    main_opportunities: opportunities,
    budget_recommendations: Array.isArray(parsed.budget_recommendations) ? parsed.budget_recommendations.map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : { value: item })) : []
  };
}

export const parseAIResponse = parseAIResponseV1;

export function buildChatPrompt(request: AIChatRequest, recentMessages: AIChatMessage[] = []): { system: string; user: string } {
  const context = buildAIContextSummary({
    analysis: request.analysis,
    targets: request.targets,
    cleanedRows: request.cleanedRows,
    allowDetailedAiData: request.allowDetailedAiData
  });
  const recentConversation = recentMessages.slice(-8).map((message) => ({
    role: message.role,
    content: message.content
  }));
  const insightSummary = request.aiInsights
    ? {
        executive_summary: request.aiInsights.executive_summary,
        key_findings: request.aiInsights.key_findings ?? [],
        growth_opportunities: request.aiInsights.growth_opportunities ?? request.aiInsights.main_opportunities ?? [],
        risks: request.aiInsights.risks ?? request.aiInsights.main_problems ?? [],
        budget_actions: request.aiInsights.budget_actions ?? request.aiInsights.budget_recommendations ?? [],
        next_steps: request.aiInsights.next_steps ?? []
      }
    : null;

  return {
    system:
      "You are GrowthLens AI Analyst Chat. Answer only from the provided campaign analysis context. Do not invent data. If the answer is not supported by the context, say what is missing and suggest the next deterministic check. Keep answers concise, practical, and suitable for a marketing analyst or agency client.",
    user: JSON.stringify(
      {
        question: request.question,
        context,
        decisionPanel: insightSummary,
        recentConversation
      },
      null,
      2
    )
  };
}
