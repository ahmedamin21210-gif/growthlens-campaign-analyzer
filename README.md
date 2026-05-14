# GrowthLens Campaign Analyzer

GrowthLens Campaign Analyzer is a local-first desktop app for turning ad campaign exports into KPI dashboards, Leak Detector findings, Action Plans, AI-assisted Decision Panel summaries, AI Analyst Chat answers, and exportable Executive Brief PDFs.

This repository is for **GrowthLens Campaign Analyzer only**. GrowthLens Competitor has been moved out of this project folder into the sibling folder:

```text
../growthlens-competitor-separated/
```

## Features

- Version 1 production desktop workflow
- CSV, XLSX, and XLS campaign upload
- Automatic column detection with manual mapping
- Data cleaning for currency, percentages, commas, dates, missing rows, duplicates, and impossible values
- KPI engine for spend, impressions, clicks, CTR, CPC, CPM, CPA, ROAS, conversion rate, AOV, and profit estimate
- Growth Score and campaign health classification
- Leak Detector for wasted spend and weak campaign performance
- Rule-based Action Plan recommendations
- Optional AI Decision Panel using OpenAI or Anthropic
- Optional AI Analyst Chat grounded in the current workspace analysis
- Branded Executive Brief PDF export
- Local SQLite workspace save/load
- Local-first operation with no cloud account required

## Tech Stack

- Electron
- React
- TypeScript
- Tailwind CSS
- Recharts
- Lucide React
- PapaParse
- `@e965/xlsx`
- SQLite via `better-sqlite3`
- OpenAI and Anthropic SDKs
- Electron Builder
- Vitest

## Install

```bash
npm install
```

If native SQLite bindings need rebuilding for Electron:

```bash
npm run rebuild:electron
```

## Run Development Mode

```bash
npm run dev
```

This starts Vite, compiles the Electron main/preload process, and launches the desktop app.

## Test

```bash
npm test -- --run
```

## Build

```bash
npm run build
```

## Package Desktop App

```bash
npm run package
```

Linux AppImage/deb packaging is configured. macOS and Windows targets are present for later release environments.

## AI Configuration

AI is optional and disabled by default. The deterministic KPI engine, Growth Scores, Leak Detector, Action Plan, save/load, and PDF export work without an AI key.

You can configure an API key in Settings. The Electron main process stores keys with `safeStorage` when available and never exposes keys to renderer logs.

Environment-variable fallback is also supported:

```bash
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
```

By default, only summarized campaign metrics are sent to the selected AI provider: overall KPIs, targets, top/worst campaigns, campaign summaries, deterministic recommendations, trend summary, and Leak Detector findings. Raw cleaned rows are not sent unless **Allow detailed AI data** is explicitly enabled in Settings.

AI features in V1:

- **Decision Panel:** Executive Summary, Key Findings, Growth Opportunities, Risks, Budget Actions, Campaign Recommendations, Next Steps, and Audit Note.
- **AI Analyst Chat:** Ask follow-up questions such as “Which campaigns are leaking budget?” or “Where should I move budget?” Chat answers are advisory, context-bound, and never modify campaign data.
- **Fallback behavior:** If AI is disabled, not configured, times out, or returns invalid JSON, GrowthLens keeps deterministic rule-based analysis available.

## V1 User Workflow

1. Open the app and upload a CSV/XLSX/XLS campaign export or load the demo dataset.
2. Review detected columns and manually map any unclear fields.
3. Run analysis to clean data, calculate KPIs, Growth Scores, Leak Detector findings, and Action Plan items.
4. Generate the Decision Panel. With AI disabled, GrowthLens produces deterministic guidance; with AI enabled, it adds provider-backed analysis.
5. Use AI Analyst Chat for follow-up questions once AI is configured.
6. Save the workspace locally, export an Executive Brief PDF, and reopen saved workspaces later.

## Sample Data

Use the included sample file:

```text
sample-data/campaign_sample.csv
```

In the app, click **Load demo data** from Home.

## Local Data

The desktop app stores workspaces in the operating system’s Electron user-data directory as:

```text
growthlens-campaign.sqlite
```

Diagnostic logs are stored in:

```text
logs/growthlens-campaign.log
```

Saved workspace chat history is stored in the same local SQLite database. Deleting a workspace removes linked chat sessions.

## Release Artifacts

Run:

```bash
npm run package
```

Electron Builder creates Linux release artifacts under:

```text
release/
```

Artifacts are named for **GrowthLens Campaign Analyzer**. The configured Linux targets are AppImage and deb.

## Known Limits

- Files larger than 25 MB are blocked in the desktop file picker path.
- AI Analyst Chat does not stream responses in V1.
- AI summaries are advisory and never replace deterministic calculations.
- AI can analyze only the current GrowthLens campaign analysis context; it will not inspect external ad accounts or private URLs.
- Protected cloud sync, user accounts, and direct ad-platform API integrations are future roadmap items.
- GrowthLens Competitor is intentionally not part of this repository.

## Troubleshooting

- If uploads fail, confirm the file is CSV, XLSX, or XLS and under 25 MB.
- If AI fails, verify the selected provider, API key, model name, and internet connection in Settings.
- If PDF export fails, try another save folder and check Diagnostics for the local log path.
- If SQLite native bindings fail in development, run `npm run rebuild:electron`.

## Roadmap

- Direct Meta Ads and Google Ads imports
- Multi-client agency dashboard
- Scheduled report generation
- White-label agency reports
- Forecasting models
- SaaS cloud version
