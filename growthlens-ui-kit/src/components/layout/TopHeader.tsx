import type { ReactNode } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { IconOnlyLogo } from "../brand/GrowthLensLogo";
import { StatusBadge } from "../ui/StatusBadge";
import { cn } from "../../lib/cn";

export function TopHeader({
  productName = "GrowthLens Campaign",
  eyebrow = "by GrowthLens AI",
  context = "Turn marketing data into revenue decisions.",
  badge = "Campaign Intelligence",
  loadingLabel,
  error,
  onDismissError,
  rightSlot,
  className
}: {
  productName?: string;
  eyebrow?: string;
  context?: string;
  badge?: string;
  loadingLabel?: string | null;
  error?: string | null;
  onDismissError?: () => void;
  rightSlot?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("sticky top-0 z-10 border-b border-brand-border bg-brand-bg/95 px-7 py-4 backdrop-blur", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <IconOnlyLogo size="sm" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-xl font-bold tracking-normal text-brand-navy">{productName}</h1>
              <StatusBadge tone="cyan">{badge}</StatusBadge>
            </div>
            <div className="mt-1 text-xs font-medium text-slate-500">
              {eyebrow} · {context}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {rightSlot}
          {loadingLabel ? (
            <div className="flex items-center gap-2 rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
              <Loader2 className="animate-spin" size={16} />
              {loadingLabel}
            </div>
          ) : null}
        </div>
      </div>
      {error ? (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <span className="flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </span>
          {onDismissError ? (
            <button className="rounded-lg p-1 hover:bg-red-100" onClick={onDismissError} aria-label="Dismiss error">
              <X size={16} />
            </button>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
