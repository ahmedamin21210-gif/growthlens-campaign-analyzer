import type { LucideIcon } from "lucide-react";
import { Card } from "../ui/Card";
import { cn } from "../../lib/utils";

export function KPICard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "teal"
}: {
  label: string;
  value: string;
  helper?: string;
  icon: LucideIcon;
  tone?: "teal" | "green" | "amber" | "red" | "blue";
}) {
  return (
    <Card className="overflow-hidden p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
          <div className="mt-2 font-display text-2xl font-bold tracking-normal text-brand-navy">{value}</div>
          {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-2xl",
            tone === "teal" && "bg-cyan-50 text-brand-cyan",
            tone === "green" && "bg-green-50 text-brand-green",
            tone === "amber" && "bg-amber-50 text-brand-amber",
            tone === "red" && "bg-red-50 text-brand-red",
            tone === "blue" && "bg-cyan-50 text-brand-cyan"
          )}
        >
          <Icon size={18} />
        </div>
      </div>
    </Card>
  );
}
