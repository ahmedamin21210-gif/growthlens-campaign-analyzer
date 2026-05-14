import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-brand-border bg-white shadow-executive", className)}>
      <div className="flex items-start justify-between gap-4 border-b border-brand-border px-5 py-4">
        <div>
          <h2 className="font-display text-base font-semibold tracking-normal text-brand-navy">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
