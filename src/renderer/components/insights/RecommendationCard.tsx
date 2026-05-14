import type { Recommendation } from "@shared/types";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const tone = recommendation.severity === "critical" || recommendation.severity === "high" ? "red" : recommendation.severity === "medium" ? "amber" : "green";
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-950">{recommendation.issue}</div>
          {recommendation.campaignName ? <div className="mt-1 text-xs text-slate-500">{recommendation.campaignName}</div> : null}
        </div>
        <Badge tone={tone}>{recommendation.severity}</Badge>
      </div>
      <p className="text-sm text-slate-700">{recommendation.action}</p>
      <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
        <strong>Evidence:</strong> {recommendation.evidence}
        <br />
        <strong>Impact:</strong> {recommendation.expectedImpact}
      </div>
    </Card>
  );
}
