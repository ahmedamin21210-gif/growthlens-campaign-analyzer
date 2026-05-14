export const growthLensBrand = {
  parentBrand: "GrowthLens AI",
  productName: "GrowthLens Campaign",
  slogan: "Turn marketing data into revenue decisions.",
  badge: "Campaign Intelligence",
  colors: {
    navy: "#1E1B4B",
    cyan: "#06B6D4",
    green: "#22C55E",
    amber: "#F59E0B",
    red: "#EF4444",
    background: "#F8FAFC",
    darkBackground: "#0F172A",
    darkText: "#111827",
    lightText: "#F9FAFB",
    mutedText: "#64748B",
    border: "#E2E8F0"
  },
  typography: {
    body: "Inter, ui-sans-serif, system-ui, sans-serif",
    heading: "Space Grotesk, Inter, ui-sans-serif, system-ui, sans-serif"
  },
  spacing: {
    page: "28px",
    section: "24px",
    card: "20px",
    compact: "12px"
  },
  radius: {
    sm: "10px",
    md: "14px",
    lg: "18px",
    xl: "20px"
  },
  shadows: {
    card: "0 20px 60px rgba(30, 27, 75, 0.10)",
    subtle: "0 12px 32px rgba(15, 23, 42, 0.08)"
  },
  featureNames: {
    dashboard: "Command Center",
    upload: "Upload Data",
    analysis: "Analysis",
    insights: "Decision Panel",
    recommendations: "Action Plan",
    reports: "Executive Brief",
    projects: "Workspaces",
    wastedSpend: "Leak Detector",
    healthScore: "Growth Score",
    forecasting: "Growth Forecast",
    alerts: "Market Signals"
  },
  buttonCopy: {
    upload: "Upload Campaign Data",
    generateDecisionPanel: "Generate Decision Panel",
    exportBrief: "Export Executive Brief",
    saveWorkspace: "Save Workspace",
    openWorkspace: "Open Workspace",
    viewActionPlan: "View Action Plan",
    runAnalysis: "Run Analysis",
    analyzeCampaigns: "Analyze Campaigns"
  }
} as const;

export type GrowthLensTone = "navy" | "cyan" | "green" | "amber" | "red" | "slate";
