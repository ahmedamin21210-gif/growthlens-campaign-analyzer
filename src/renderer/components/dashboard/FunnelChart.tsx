import type { OverallKPI } from "@shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { numberCompact } from "../../lib/utils";

export function FunnelChart({ overall }: { overall: OverallKPI }) {
  const steps = [
    { label: "Impressions", value: overall.totalImpressions, color: "bg-brand-cyan" },
    { label: "Clicks", value: overall.totalClicks, color: "bg-brand-navy" },
    { label: "Conversions", value: overall.totalConversions, color: "bg-brand-green" },
    { label: "Revenue", value: overall.totalRevenue, color: "bg-brand-amber" }
  ];
  const max = Math.max(...steps.map((step) => step.value), 1);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue funnel</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {steps.map((step) => (
          <div key={step.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{step.label}</span>
              <span className="text-slate-500">{numberCompact(step.value)}</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100">
              <div className={`${step.color} h-3 rounded-full`} style={{ width: `${Math.max((step.value / max) * 100, 4)}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
