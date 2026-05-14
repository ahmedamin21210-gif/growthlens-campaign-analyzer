import type { ComponentType, ReactNode } from "react";
import { cn } from "../../lib/cn";

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className
}: {
  title: string;
  description?: string;
  icon?: ComponentType<{ size?: number | string; className?: string }>;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center", className)}>
      {Icon ? (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-brand-cyan">
          <Icon size={26} />
        </div>
      ) : null}
      <h3 className="font-display text-lg font-semibold text-brand-navy">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
