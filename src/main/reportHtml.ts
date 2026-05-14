import type { AIInsightResponse, AnalysisSummary, BrandingSettings } from "../shared/types";

function currency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function percent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return `${(value * 100).toFixed(2)}%`;
}

export function buildReportHtml(input: {
  title: string;
  dateRange?: string;
  generatedAt: string;
  analysis: AnalysisSummary;
  aiInsights?: AIInsightResponse | null;
  branding: BrandingSettings;
}): string {
  const { analysis, branding, aiInsights } = input;
  const brandColor = /^#[0-9a-fA-F]{6}$/.test(branding.primaryColor || "") ? branding.primaryColor : "#1E1B4B";
  const rows = analysis.campaigns
    .slice(0, 25)
    .map(
      (campaign) => `
        <tr>
          <td>${escapeHtml(campaign.campaignName)}</td>
          <td>${currency(campaign.spend)}</td>
          <td>${currency(campaign.revenue)}</td>
          <td>${campaign.roas?.toFixed(2) ?? "-"}</td>
          <td>${campaign.conversions.toLocaleString()}</td>
          <td>${percent(campaign.ctr)}</td>
          <td>${campaign.healthScore}</td>
          <td>${escapeHtml(campaign.recommendedAction)}</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Inter, Arial, sans-serif; color: #172033; margin: 0; background: #fff; }
        .cover { padding: 64px 56px 36px; background: ${brandColor}; color: #fff; }
        h1 { font-size: 34px; margin: 0 0 12px; }
        h2 { font-size: 20px; margin: 34px 0 14px; color: #172033; }
        .muted { color: #64748b; }
        .section { padding: 0 56px; }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 20px; }
        .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
        .label { font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: .08em; }
        .value { font-size: 22px; font-weight: 700; margin-top: 6px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { padding: 9px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; }
        th { background: #f8fafc; color: #475569; }
        .finding { border-left: 4px solid ${brandColor}; padding: 10px 12px; margin: 8px 0; background: #f8fafc; }
        footer { padding: 28px 56px; font-size: 11px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="cover">
        <div>${escapeHtml(branding.companyName || "GrowthLens AI")}</div>
        <h1>${escapeHtml(input.title)}</h1>
        <div>${escapeHtml(branding.clientName || "GrowthLens Campaign Executive Brief")} ${input.dateRange ? `· ${escapeHtml(input.dateRange)}` : ""}</div>
        <div>Generated ${escapeHtml(input.generatedAt)}</div>
      </div>
      <div class="section">
        <h2>Executive Summary</h2>
        <p>${escapeHtml(aiInsights?.executive_summary ?? "Deterministic campaign analysis completed. Configure AI settings to generate a richer executive summary.")}</p>
        <div class="grid">
          <div class="card"><div class="label">Spend</div><div class="value">${currency(analysis.overall.totalSpend)}</div></div>
          <div class="card"><div class="label">Revenue</div><div class="value">${currency(analysis.overall.totalRevenue)}</div></div>
          <div class="card"><div class="label">ROAS</div><div class="value">${analysis.overall.roas?.toFixed(2) ?? "-"}</div></div>
          <div class="card"><div class="label">Leak Detector</div><div class="value">${currency(analysis.overall.wastedSpend)}</div></div>
          <div class="card"><div class="label">Clicks</div><div class="value">${analysis.overall.totalClicks.toLocaleString()}</div></div>
          <div class="card"><div class="label">CTR</div><div class="value">${percent(analysis.overall.ctr)}</div></div>
          <div class="card"><div class="label">Conversions</div><div class="value">${analysis.overall.totalConversions.toLocaleString()}</div></div>
          <div class="card"><div class="label">CPA</div><div class="value">${currency(analysis.overall.cpa)}</div></div>
        </div>
        <h2>Growth Leaders</h2>
        ${analysis.topCampaigns.map((campaign) => `<div class="finding"><strong>${escapeHtml(campaign.campaignName)}</strong> · ${campaign.healthScore}/100 Growth Score · ${currency(campaign.spend)} spend · ROAS ${campaign.roas?.toFixed(2) ?? "-"}</div>`).join("")}
        <h2>Leak Detector</h2>
        ${analysis.worstCampaigns.map((campaign) => `<div class="finding"><strong>${escapeHtml(campaign.campaignName)}</strong> · ${currency(campaign.wastedSpend)} leaked spend · ${campaign.healthScore}/100 Growth Score · ${escapeHtml(campaign.recommendedAction)}</div>`).join("")}
        <h2>Decision Panel Action Plan</h2>
        ${(aiInsights?.next_steps ?? analysis.recommendations.slice(0, 8).map((item) => `${item.campaignName ? `${item.campaignName}: ` : ""}${item.action}`))
          .map((step) => `<div class="finding">${escapeHtml(step)}</div>`)
          .join("")}
        <h2>Campaign Appendix</h2>
        <table>
          <thead><tr><th>Campaign</th><th>Spend</th><th>Revenue</th><th>ROAS</th><th>Conv.</th><th>CTR</th><th>Growth Score</th><th>Action</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <footer>${escapeHtml(branding.reportFooter || "Generated by GrowthLens Campaign")} ${branding.analystName ? `· Analyst: ${escapeHtml(branding.analystName)}` : ""}</footer>
    </body>
  </html>`;
}

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
