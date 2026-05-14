export const standardFields = [
  "campaign_name",
  "adset_name",
  "ad_name",
  "date",
  "impressions",
  "clicks",
  "spend",
  "conversions",
  "conversion_value",
  "revenue",
  "purchases",
  "leads",
  "ctr",
  "cpc",
  "cpm",
  "cpa",
  "roas",
  "platform",
  "objective",
  "country",
  "device",
  "age",
  "gender"
] as const;

export type StandardField = (typeof standardFields)[number];

export type RawCampaignRow = Record<string, string | number | boolean | null | undefined>;

export type CampaignRow = {
  date?: string;
  campaignName: string;
  adsetName?: string;
  adName?: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions?: number;
  conversionValue?: number;
  revenue?: number;
  leads?: number;
  purchases?: number;
  platform?: string;
  objective?: string;
  country?: string;
  device?: string;
  age?: string;
  gender?: string;
};

export type ColumnMapping = Partial<Record<StandardField, string>>;

export type ColumnCandidate = {
  field: StandardField;
  column: string;
  confidence: number;
  reason: string;
};

export type ColumnDetectionResult = {
  mapping: ColumnMapping;
  candidates: ColumnCandidate[];
  missingRequiredFields: StandardField[];
  detectedPlatform?: string;
  headers: string[];
};

export type CleaningIssue = {
  rowIndex?: number;
  field?: StandardField;
  severity: "info" | "warning" | "error";
  message: string;
};

export type CleaningResult = {
  rows: CampaignRow[];
  warnings: CleaningIssue[];
  errors: CleaningIssue[];
  duplicateRows: number;
  removedRows: number;
  missingValueCount: number;
};

export type MarketingTargets = {
  targetRoas: number;
  targetCpa?: number | null;
  minimumCtr: number;
  maximumCpc?: number | null;
  minimumConversionRate: number;
  profitMargin?: number | null;
};

export type OverallKPI = {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  totalLeads: number;
  totalPurchases: number;
  ctr: number;
  cpc: number | null;
  cpm: number | null;
  cpa: number | null;
  roas: number | null;
  conversionRate: number | null;
  costPerLead: number | null;
  costPerPurchase: number | null;
  averageOrderValue: number | null;
  profitEstimate: number | null;
  wastedSpend: number;
  campaignCount: number;
};

export type CampaignHealthStatus = "Excellent" | "Good" | "Average" | "Weak" | "Critical";

export type CampaignKPI = {
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  leads: number;
  purchases: number;
  ctr: number;
  cpc: number | null;
  cpm: number | null;
  cpa: number | null;
  roas: number | null;
  conversionRate: number | null;
  costPerLead: number | null;
  costPerPurchase: number | null;
  averageOrderValue: number | null;
  healthScore: number;
  status: CampaignHealthStatus;
  recommendedAction: string;
  spendShare: number;
  revenueShare: number;
  conversionShare: number;
  wastedSpend: number;
  trendDirection: "up" | "down" | "flat" | "unknown";
};

export type TrendPoint = {
  date: string;
  spend: number;
  revenue: number;
  conversions: number;
  clicks: number;
  impressions: number;
  roas: number | null;
  cpa: number | null;
};

export type WastedSpendFinding = {
  campaignName: string;
  amount: number;
  reasons: string[];
  severity: "low" | "medium" | "high" | "critical";
  suggestedAction:
    | "Pause campaign"
    | "Reduce budget"
    | "Improve creative"
    | "Improve landing page"
    | "Change targeting"
    | "Increase budget"
    | "Monitor only";
};

export type Recommendation = {
  campaignName?: string;
  issue: string;
  evidence: string;
  severity: "low" | "medium" | "high" | "critical";
  action: string;
  reason: string;
  expectedImpact: string;
};

export type AISeverity = "low" | "medium" | "high" | "critical";

export type AIKeyFinding = {
  title: string;
  description: string;
  severity: AISeverity;
  evidence: string;
};

export type AIBudgetAction = {
  campaign?: string;
  current_spend?: number;
  recommended_action: string;
  reason: string;
  priority: AISeverity;
};

export type AICampaignRecommendation = {
  campaign?: string;
  problem: string;
  action: string;
  expected_impact: string;
  priority: AISeverity;
  evidence?: string;
};

export type AIInsightResponseV1 = {
  executive_summary: string;
  key_findings: AIKeyFinding[];
  growth_opportunities: string[];
  risks: string[];
  budget_actions: AIBudgetAction[];
  campaign_recommendations: AICampaignRecommendation[];
  next_steps: string[];
  audit_note: string;
  generated_at?: string;
  provider?: AppSettings["aiProvider"];
  model?: string;
  fallback?: boolean;
  error?: string;
  /**
   * Backward-compatible aliases used by older saved workspaces and report
   * components. V1 UI should prefer risks and growth_opportunities.
   */
  main_problems: string[];
  main_opportunities: string[];
  budget_recommendations: Array<Record<string, unknown>>;
};

export type AIInsightResponse = AIInsightResponseV1;

export type AnalysisSummary = {
  overall: OverallKPI;
  campaigns: CampaignKPI[];
  trend: TrendPoint[];
  wastedSpend: WastedSpendFinding[];
  recommendations: Recommendation[];
  topCampaigns: CampaignKPI[];
  worstCampaigns: CampaignKPI[];
};

export type ParsedCampaignFile = {
  fileName: string;
  filePath?: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  rows: RawCampaignRow[];
  previewRows: RawCampaignRow[];
  detectedPlatform?: string;
  warnings: string[];
};

export type BrandingSettings = {
  companyName: string;
  analystName: string;
  clientName: string;
  primaryColor: string;
  reportFooter: string;
  logoPath?: string;
};

export type AppSettings = {
  aiProvider: "openai" | "anthropic" | "disabled";
  apiKey?: string;
  hasStoredApiKey?: boolean;
  model: string;
  targets: MarketingTargets;
  branding: BrandingSettings;
  defaultCurrency: string;
  dateFormat: string;
  defaultAttributionField: string;
  allowDetailedAiData: boolean;
};

export type ProjectPayload = {
  id?: string;
  name: string;
  clientName?: string;
  platform?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  originalFileName: string;
  cleanedRows: CampaignRow[];
  columnMapping: ColumnMapping;
  analysis: AnalysisSummary;
  aiInsights?: AIInsightResponse | null;
};

export type ProjectRecord = ProjectPayload & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type AIContextSummary = {
  targets: MarketingTargets;
  overallKPIs: OverallKPI;
  topCampaigns: Array<Pick<CampaignKPI, "campaignName" | "spend" | "revenue" | "conversions" | "roas" | "cpa" | "ctr" | "conversionRate" | "healthScore" | "recommendedAction">>;
  worstCampaigns: Array<Pick<CampaignKPI, "campaignName" | "spend" | "revenue" | "conversions" | "roas" | "cpa" | "ctr" | "conversionRate" | "healthScore" | "wastedSpend" | "recommendedAction">>;
  campaignSummaries: Array<Pick<CampaignKPI, "campaignName" | "spend" | "revenue" | "conversions" | "roas" | "cpa" | "ctr" | "conversionRate" | "healthScore" | "status" | "recommendedAction" | "wastedSpend">>;
  recommendations: Recommendation[];
  wastedSpend: WastedSpendFinding[];
  trendSummary: {
    pointCount: number;
    firstDate?: string;
    lastDate?: string;
    firstSpend?: number;
    lastSpend?: number;
    firstRevenue?: number;
    lastRevenue?: number;
    direction: "up" | "down" | "flat" | "unknown";
  };
  detailedRowsIncluded: boolean;
  detailedRows?: CampaignRow[];
};

export type AIChatRole = "user" | "assistant";

export type AIChatMessage = {
  id: string;
  sessionId: string;
  role: AIChatRole;
  content: string;
  createdAt: string;
};

export type AIChatSession = {
  id: string;
  projectId?: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AIChatMessage[];
};

export type AIChatRequest = {
  projectId?: string | null;
  sessionId?: string | null;
  question: string;
  analysis: AnalysisSummary;
  targets: MarketingTargets;
  aiInsights?: AIInsightResponse | null;
  cleanedRows?: CampaignRow[];
  allowDetailedAiData?: boolean;
};

export type AIChatResponse = {
  session: AIChatSession;
  answer: string;
  provider: AppSettings["aiProvider"];
  model: string;
};

export const defaultTargets: MarketingTargets = {
  targetRoas: 2,
  targetCpa: null,
  minimumCtr: 0.01,
  maximumCpc: null,
  minimumConversionRate: 0.02,
  profitMargin: null
};

export const defaultSettings: AppSettings = {
  aiProvider: "disabled",
  model: "gpt-4o-mini",
  targets: defaultTargets,
  branding: {
    companyName: "GrowthLens AI",
    analystName: "",
    clientName: "",
    primaryColor: "#1E1B4B",
    reportFooter: "Generated by GrowthLens Campaign"
  },
  defaultCurrency: "USD",
  dateFormat: "Auto",
  defaultAttributionField: "conversions",
  allowDetailedAiData: false
};
