import type { ComponentType, ReactNode } from "react";
import { BriefcaseBusiness } from "lucide-react";
import { ProductLogo } from "../brand/GrowthLensLogo";
import { cn } from "../../lib/cn";

export type SidebarItem = {
  href: string;
  label: string;
  icon?: ComponentType<{ size?: number | string; className?: string }>;
};

export function Sidebar({
  items,
  activeHref,
  productName = "Campaign",
  spotlightLabel = "Campaign Intelligence",
  spotlightDescription = "Turn marketing data into revenue decisions.",
  footer,
  renderLink,
  className
}: {
  items: SidebarItem[];
  activeHref?: string;
  productName?: string;
  spotlightLabel?: string;
  spotlightDescription?: string;
  footer?: ReactNode;
  renderLink?: (item: SidebarItem, content: ReactNode, active: boolean) => ReactNode;
  className?: string;
}) {
  return (
    <aside className={cn("flex h-screen w-72 shrink-0 flex-col border-r border-white/10 bg-brand-navy text-white shadow-2xl", className)}>
      <div className="flex h-20 items-center border-b border-white/10 px-5">
        <ProductLogo productName={productName} size="sm" className="[&_*]:text-white [&_.text-brand-green]:text-brand-cyan [&_.text-slate-600]:text-slate-300" />
      </div>
      <nav className="grid gap-1 p-3">
        {items.map((item) => {
          const active = activeHref === item.href;
          const Icon = item.icon;
          const content = (
            <span className={cn("flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition", active ? "bg-cyan-400/15 text-white ring-1 ring-cyan-300/30" : "text-slate-300 hover:bg-white/10 hover:text-white")}>
              {Icon ? <Icon size={18} /> : null}
              {item.label}
            </span>
          );
          return renderLink ? (
            <div key={item.href}>{renderLink(item, content, active)}</div>
          ) : (
            <a key={item.href} href={item.href}>
              {content}
            </a>
          );
        })}
      </nav>
      <div className="mx-3 mt-2 rounded-2xl border border-cyan-300/20 bg-white/5 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
          <BriefcaseBusiness size={14} />
          {spotlightLabel}
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-300">{spotlightDescription}</p>
      </div>
      <div className="mt-auto border-t border-white/10 p-4 text-xs leading-5 text-slate-300">
        {footer ?? "Local-first workspace. AI summaries use campaign metrics only when enabled."}
      </div>
    </aside>
  );
}
