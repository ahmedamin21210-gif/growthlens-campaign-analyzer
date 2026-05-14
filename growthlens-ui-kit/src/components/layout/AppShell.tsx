import type { ReactNode } from "react";
import type { SidebarItem } from "./Sidebar";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";

export function AppShell({
  children,
  sidebarItems,
  activeHref,
  productName,
  headerContext,
  loadingLabel,
  error,
  onDismissError
}: {
  children: ReactNode;
  sidebarItems: SidebarItem[];
  activeHref?: string;
  productName?: string;
  headerContext?: string;
  loadingLabel?: string | null;
  error?: string | null;
  onDismissError?: () => void;
}) {
  return (
    <div className="gl-app-bg flex min-h-screen">
      <Sidebar items={sidebarItems} activeHref={activeHref} productName={productName?.replace("GrowthLens ", "")} />
      <div className="min-w-0 flex-1">
        <TopHeader productName={productName} context={headerContext} loadingLabel={loadingLabel} error={error} onDismissError={onDismissError} />
        <main className="px-7 py-6">{children}</main>
      </div>
    </div>
  );
}
