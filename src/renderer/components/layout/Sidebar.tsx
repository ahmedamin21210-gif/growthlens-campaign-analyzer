import { Brain, BriefcaseBusiness, FileDown, FolderOpen, LayoutDashboard, Settings, Table2, Upload } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";
import { GrowthLensLogo } from "../brand/GrowthLensLogo";

const items = [
  { to: "/dashboard", label: "Command Center", icon: LayoutDashboard },
  { to: "/upload", label: "Upload Data", icon: Upload },
  { to: "/campaigns", label: "Analysis", icon: Table2 },
  { to: "/insights", label: "Decision Panel", icon: Brain },
  { to: "/reports", label: "Executive Brief", icon: FileDown },
  { to: "/projects", label: "Workspaces", icon: FolderOpen },
  { to: "/settings", label: "Settings", icon: Settings }
];

export function Sidebar() {
  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-white/10 bg-brand-navy text-white shadow-2xl">
      <div className="flex h-20 items-center border-b border-white/10 px-5">
        <GrowthLensLogo variant="product" size="sm" className="[&_*]:text-white [&_.text-brand-green]:text-brand-cyan [&_.text-slate-600]:text-slate-300" />
      </div>
      <nav className="grid gap-1 p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white",
                isActive && "bg-cyan-400/15 text-white ring-1 ring-cyan-300/30"
              )
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mx-3 mt-2 rounded-2xl border border-cyan-300/20 bg-white/5 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
          <BriefcaseBusiness size={14} />
          Campaign Intelligence
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-300">Turn marketing data into revenue decisions.</p>
      </div>
      <div className="mt-auto border-t border-white/10 p-4 text-xs leading-5 text-slate-300">
        Local-first workspace. AI summaries use campaign metrics only when enabled.
      </div>
    </aside>
  );
}
