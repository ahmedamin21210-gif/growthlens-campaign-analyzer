import type { ComponentType, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type KPITone = "cyan" | "green" | "amber" | "red" | "navy";

const iconTone: Record<KPITone, string> = {
  cyan: "bg-cyan-50 text-brand-cyan",
  green: "bg-green-50 text-brand-green",
  amber: "bg-amber-50 text-brand-amber",
  red: "bg-red-50 text-brand-red",
  navy: "bg-indigo-50 text-brand-navy"
};

export function KPICard({
  label,
  value,
  helper,
  trend,
  icon: Icon,
  tone = "cyan",
  className
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  trend?: ReactNode;
  icon?: ComponentType<{ size?: number | string; className?: string }>;
  tone?: KPITone;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-brand-border bg-white p-4 shadow-executive", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
          <div className="mt-2 font-display text-2xl font-bold tracking-normal text-brand-navy">{value}</div>
          {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}
          {trend ? <div className="mt-2 text-xs font-semibold text-brand-green">{trend}</div> : null}
        </div>
        {Icon ? (
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", iconTone[tone])}>
            <Icon size={18} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
