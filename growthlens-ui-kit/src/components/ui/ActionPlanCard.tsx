import { StatusBadge, type StatusTone } from "./StatusBadge";
import { cn } from "../../lib/cn";

export type ActionSeverity = "low" | "medium" | "high" | "critical";

const severityTone: Record<ActionSeverity, StatusTone> = {
  low: "green",
  medium: "amber",
  high: "red",
  critical: "red"
};

export function ActionPlanCard({
  issue,
  action,
  evidence,
  expectedImpact,
  severity = "medium",
  campaignName,
  contextLabel,
  className
}: {
  issue: string;
  action: string;
  evidence?: string;
  expectedImpact?: string;
  severity?: ActionSeverity;
  campaignName?: string;
  contextLabel?: string;
  className?: string;
}) {
  const supportingLabel = contextLabel ?? campaignName;

  return (
    <article className={cn("rounded-2xl border border-brand-border bg-white p-4 shadow-executive", className)}>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-brand-navy">{issue}</h3>
          {supportingLabel ? <p className="mt-1 text-xs text-slate-500">{supportingLabel}</p> : null}
        </div>
        <StatusBadge tone={severityTone[severity]}>{severity}</StatusBadge>
      </div>
      <p className="text-sm leading-6 text-slate-700">{action}</p>
      {(evidence || expectedImpact) ? (
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          {evidence ? (
            <>
              <strong>Evidence:</strong> {evidence}
            </>
          ) : null}
          {evidence && expectedImpact ? <br /> : null}
          {expectedImpact ? (
            <>
              <strong>Impact:</strong> {expectedImpact}
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
