import { useMemo, useState } from "react";
import type { CampaignKPI } from "@shared/types";
import { money, percent } from "../../lib/utils";
import { Input } from "../ui/Form";
import { HealthScoreBadge } from "./HealthScoreBadge";

type SortKey = keyof Pick<CampaignKPI, "spend" | "revenue" | "roas" | "ctr" | "cpc" | "conversions" | "cpa" | "conversionRate" | "healthScore" | "wastedSpend">;

export function CampaignTable({ campaigns }: { campaigns: CampaignKPI[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const sorted = useMemo(() => {
    return [...campaigns]
      .filter((campaign) => campaign.campaignName.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => Number(b[sortKey] ?? -1) - Number(a[sortKey] ?? -1));
  }, [campaigns, query, sortKey]);

  const header = (label: string, key: SortKey) => (
    <button className="font-semibold text-slate-600 hover:text-slate-950" onClick={() => setSortKey(key)}>
      {label}
    </button>
  );

  return (
    <div className="rounded-2xl border border-brand-border bg-white shadow-executive">
      <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
        <div>
          <h2 className="font-display text-base font-semibold text-brand-navy">Analysis table</h2>
          <p className="text-sm text-slate-500">Sort, filter, and inspect campaign-level performance.</p>
        </div>
        <Input className="w-72" placeholder="Filter campaigns..." value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <div className="max-h-[640px] overflow-auto">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Campaign Name</th>
              <th className="px-3 py-3">{header("Spend", "spend")}</th>
              <th className="px-3 py-3">{header("Revenue", "revenue")}</th>
              <th className="px-3 py-3">{header("ROAS", "roas")}</th>
              <th className="px-3 py-3">Clicks</th>
              <th className="px-3 py-3">{header("CTR", "ctr")}</th>
              <th className="px-3 py-3">{header("CPC", "cpc")}</th>
              <th className="px-3 py-3">{header("Conv.", "conversions")}</th>
              <th className="px-3 py-3">{header("CPA", "cpa")}</th>
              <th className="px-3 py-3">{header("CVR", "conversionRate")}</th>
              <th className="px-3 py-3">{header("Growth Score", "healthScore")}</th>
              <th className="px-3 py-3">Recommended Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((campaign) => (
              <tr key={campaign.campaignName} className="border-t border-border odd:bg-white even:bg-slate-50/60">
                <td className="max-w-72 truncate px-3 py-3 font-medium text-slate-900">{campaign.campaignName}</td>
                <td className="px-3 py-3">{money(campaign.spend)}</td>
                <td className="px-3 py-3">{money(campaign.revenue)}</td>
                <td className="px-3 py-3">{campaign.roas?.toFixed(2) ?? "-"}</td>
                <td className="px-3 py-3">{campaign.clicks.toLocaleString()}</td>
                <td className="px-3 py-3">{percent(campaign.ctr)}</td>
                <td className="px-3 py-3">{money(campaign.cpc)}</td>
                <td className="px-3 py-3">{campaign.conversions.toLocaleString()}</td>
                <td className="px-3 py-3">{money(campaign.cpa)}</td>
                <td className="px-3 py-3">{percent(campaign.conversionRate)}</td>
                <td className="px-3 py-3"><HealthScoreBadge score={campaign.healthScore} status={campaign.status} /></td>
                <td className="px-3 py-3 text-slate-700">{campaign.recommendedAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
