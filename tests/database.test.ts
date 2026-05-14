import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeCampaigns } from "../src/shared/kpiEngine";
import { defaultTargets } from "../src/shared/types";

let nativeSqliteAvailable = true;
try {
  const sqlite = await import("better-sqlite3");
  const probe = new sqlite.default(":memory:");
  probe.close();
} catch {
  nativeSqliteAvailable = false;
}

const itIfSqlite = nativeSqliteAvailable ? it : it.skip;

describe("campaign database", () => {
  itIfSqlite("round-trips a saved campaign workspace", async () => {
    const { AppDatabase } = await import("../src/main/database/sqlite");
    const db = new AppDatabase(path.join(os.tmpdir(), `growthlens-campaign-test-${Date.now()}-${Math.random()}.sqlite`));
    const cleanedRows = [
      {
        campaignName: "Prospecting",
        impressions: 1000,
        clicks: 50,
        spend: 120,
        conversions: 5,
        revenue: 400,
        leads: 2,
        purchases: 3,
        date: "2026-05-01"
      }
    ];
    const analysis = analyzeCampaigns(cleanedRows, defaultTargets);
    const saved = db.saveProject({
      name: "May Campaigns",
      clientName: "Acme",
      originalFileName: "campaign.csv",
      cleanedRows,
      columnMapping: {
        campaign_name: "Campaign Name",
        impressions: "Impressions",
        clicks: "Clicks",
        spend: "Spend"
      },
      analysis,
      aiInsights: null
    });
    const loaded = db.loadProject(saved.id);
    expect(loaded?.name).toBe("May Campaigns");
    expect(loaded?.cleanedRows).toHaveLength(1);
    expect(loaded?.analysis.overall.totalSpend).toBe(120);
    const chat = db.appendChatExchange({
      projectId: saved.id,
      title: "What should I do first?",
      userContent: "What should I do first?",
      assistantContent: "Scale Prospecting carefully."
    });
    expect(chat.messages).toHaveLength(2);
    expect(db.listChatSessions(saved.id)[0]?.messages[1]?.content).toContain("Scale Prospecting");
    db.deleteProject(saved.id);
    expect(db.loadProject(saved.id)).toBeNull();
    expect(db.listChatSessions(saved.id)).toHaveLength(0);
  });
});
