import { StatusBadge } from "./StatusBadge";

export type GrowthScoreStatus = "Excellent" | "Good" | "Average" | "Weak" | "Critical";

export function growthScoreStatus(score: number): GrowthScoreStatus {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Average";
  if (score >= 30) return "Weak";
  return "Critical";
}

export function GrowthScoreBadge({ score, status = growthScoreStatus(score) }: { score: number; status?: GrowthScoreStatus }) {
  const tone = status === "Excellent" || status === "Good" ? "green" : status === "Average" ? "amber" : "red";
  return <StatusBadge tone={tone}>{score}/100 · {status}</StatusBadge>;
}
