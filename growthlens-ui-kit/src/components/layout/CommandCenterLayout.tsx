import type { ReactNode } from "react";
import { StatusBadge } from "../ui/StatusBadge";

export function CommandCenterLayout({
  badge = "Command Center",
  title = "Revenue decision dashboard",
  subtitle = "Executive KPI view, Growth Scores, Leak Detector alerts, and campaign-level action signals.",
  action,
  kpis,
  charts,
  children
}: {
  badge?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  kpis?: ReactNode;
  charts?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-executive">
        <div className="flex items-start justify-between gap-6">
          <div>
            <StatusBadge tone="cyan">{badge}</StatusBadge>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-normal text-brand-navy">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p>
          </div>
          {action}
        </div>
      </section>
      {kpis ? <section className="grid grid-cols-4 gap-4">{kpis}</section> : null}
      {charts}
      {children}
    </div>
  );
}
