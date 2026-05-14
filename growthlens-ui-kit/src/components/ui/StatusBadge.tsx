import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export type StatusTone = "slate" | "cyan" | "green" | "amber" | "red" | "navy";

const tones: Record<StatusTone, string> = {
  slate: "border-slate-200 bg-slate-50 text-slate-700",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
  green: "border-green-200 bg-green-50 text-green-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-red-200 bg-red-50 text-red-700",
  navy: "border-indigo-200 bg-indigo-50 text-brand-navy"
};

export function StatusBadge({ children, tone = "slate", className }: { children: ReactNode; tone?: StatusTone; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}
