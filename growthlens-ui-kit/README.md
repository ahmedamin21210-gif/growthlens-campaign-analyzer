# GrowthLens AI UI Kit

Reusable brand and React/Tailwind UI components extracted from the GrowthLens Campaign app.

This kit is intentionally copy-first. It does not change the current app and can be copied into a new GrowthLens product without pulling campaign-specific calculations, upload logic, AI logic, PDF export, or database code.

## What Is Included

- Brand system: colors, typography, spacing, shadows, radius, brand copy, feature names, and button copy
- Logo components: `GrowthLensLogo`, `ProductLogo`, `IconOnlyLogo`, `HorizontalLogo`, `GrowthLensIcon`
- Layout components: `Sidebar`, `TopHeader`, `AppShell`, `CommandCenterLayout`
- UI components: `KPICard`, `ChartCard`, `DataTable`, `StatusBadge`, `GrowthScoreBadge`, `DecisionPanel`, `ActionPlanCard`, `ExecutiveBriefCard`, `EmptyState`, `UploadCard`
- Tailwind preset: `tailwind.preset.ts`
- CSS variables and reusable classes: `styles/growthlens.css`

## Brand Summary

Parent brand: **GrowthLens AI**

Product pattern: **GrowthLens [Product]**

Current product: **GrowthLens Campaign**

Slogan: **Turn marketing data into revenue decisions.**

Core feature names:

- Command Center
- Upload Data
- Analysis
- Decision Panel
- Action Plan
- Executive Brief
- Workspaces
- Leak Detector
- Growth Score
- Growth Forecast
- Market Signals

## Copy Into Another GrowthLens Product

1. Copy the folder:

```bash
cp -R growthlens-ui-kit /path/to/new-product/src/growthlens-ui-kit
```

2. Install peer dependencies in the target app:

```bash
npm install lucide-react
```

React and Tailwind should already be present in most GrowthLens apps.

3. Import the CSS variables in the target app entry CSS:

```css
@import "./growthlens-ui-kit/styles/growthlens.css";
```

4. Add the Tailwind preset:

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";
import growthLensPreset from "./src/growthlens-ui-kit/tailwind.preset";

const config: Config = {
  presets: [growthLensPreset],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "./src/growthlens-ui-kit/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {}
  }
};

export default config;
```

5. Use the components:

```tsx
import {
  AppShell,
  CommandCenterLayout,
  KPICard,
  ProductLogo,
  type SidebarItem
} from "./growthlens-ui-kit/src";
import { LayoutDashboard, Upload, Brain, FileDown, Settings } from "lucide-react";

const sidebarItems: SidebarItem[] = [
  { href: "/dashboard", label: "Command Center", icon: LayoutDashboard },
  { href: "/upload", label: "Upload Data", icon: Upload },
  { href: "/insights", label: "Decision Panel", icon: Brain },
  { href: "/reports", label: "Executive Brief", icon: FileDown },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function ProductApp() {
  return (
    <AppShell
      sidebarItems={sidebarItems}
      activeHref="/dashboard"
      productName="GrowthLens Reports"
      headerContext="Turn marketing data into revenue decisions."
    >
      <CommandCenterLayout
        title="Executive reporting dashboard"
        subtitle="Monitor reporting performance, growth signals, and client-ready insights."
        kpis={<KPICard label="Revenue" value="$2.45M" helper="+18.6%" />}
      />
    </AppShell>
  );
}
```

## Logo Usage

```tsx
<GrowthLensLogo variant="full" />
<GrowthLensLogo variant="compact" />
<GrowthLensLogo variant="horizontal" />
<ProductLogo productName="Reports" />
<IconOnlyLogo />
```

Use `ProductLogo` for apps in the suite:

- GrowthLens Campaign
- GrowthLens Reports
- GrowthLens Customers
- GrowthLens Leads
- GrowthLens Attribution
- GrowthLens Forecast

## Component Notes

- `Sidebar` uses plain anchors by default. Pass `renderLink` to adapt it to React Router, Next.js, or TanStack Router.
- `DataTable` is styling-only and expects the host app to provide row data and column renderers.
- `DecisionPanel` is UI-only. The host app owns AI calls, JSON parsing, deterministic calculations, and error handling.
- `ExecutiveBriefCard` is UI-only. The host app owns PDF generation.
- `UploadCard` calls `onFile(file)` only. The host app owns parsing and validation.

## Do Not Copy Business Logic By Accident

This UI kit does not include:

- KPI calculation logic
- campaign scoring logic
- file upload/parsing internals
- AI provider logic
- PDF generation logic
- database/storage logic

Those belong in each product app or shared business packages, not the UI kit.
