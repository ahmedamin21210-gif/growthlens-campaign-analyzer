import type { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.10),transparent_28%),linear-gradient(180deg,#F8FAFC_0%,#EEF5F8_100%)]">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Header />
        <main className="px-7 py-6">{children}</main>
      </div>
    </div>
  );
}
