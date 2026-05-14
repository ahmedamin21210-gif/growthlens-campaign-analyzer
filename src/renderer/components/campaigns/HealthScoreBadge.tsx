import type { CampaignHealthStatus } from "@shared/types";
import { Badge } from "../ui/Badge";

export function HealthScoreBadge({ score, status }: { score: number; status: CampaignHealthStatus }) {
  const tone = status === "Excellent" || status === "Good" ? "green" : status === "Average" ? "amber" : "red";
  return <Badge tone={tone}>{score}/100 · {status}</Badge>;
}
