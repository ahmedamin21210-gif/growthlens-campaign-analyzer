import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { runMigrations } from "./migrations";
import { defaultSettings, type AIChatMessage, type AIChatSession, type AppSettings, type ProjectPayload, type ProjectRecord } from "../../shared/types";

type ProjectRow = {
  id: string;
  name: string;
  client_name?: string;
  platform?: string;
  created_at: string;
  updated_at: string;
  date_range_start?: string;
  date_range_end?: string;
};

type DatasetRow = {
  original_file_name: string;
  cleaned_data_json: string;
  column_mapping_json: string;
};

type AnalysisRow = {
  summary_json: string;
  ai_insights_json?: string;
};

type SettingsRow = {
  ai_provider: AppSettings["aiProvider"];
  api_key_encrypted?: string;
  model: string;
  default_targets_json: string;
  branding_json: string;
  default_currency: string;
  date_format: string;
  default_attribution_field: string;
  allow_detailed_ai_data: number;
  local_ai_base_url?: string;
};

type ChatSessionRow = {
  id: string;
  project_id?: string | null;
  title: string;
  created_at: string;
  updated_at: string;
};

type ChatMessageRow = {
  id: string;
  session_id: string;
  role: AIChatMessage["role"];
  content: string;
  created_at: string;
};

export class AppDatabase {
  private readonly db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    runMigrations(this.db);
  }

  saveProject(payload: ProjectPayload): ProjectRecord {
    const id = payload.id ?? randomUUID();
    const existing = this.db.prepare("SELECT created_at FROM projects WHERE id = ?").get(id) as { created_at: string } | undefined;
    const now = new Date().toISOString();
    const createdAt = existing?.created_at ?? now;

    const transaction = this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO projects (id, name, client_name, platform, created_at, updated_at, date_range_start, date_range_end)
           VALUES (@id, @name, @clientName, @platform, @createdAt, @updatedAt, @dateRangeStart, @dateRangeEnd)
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             client_name = excluded.client_name,
             platform = excluded.platform,
             updated_at = excluded.updated_at,
             date_range_start = excluded.date_range_start,
             date_range_end = excluded.date_range_end`
        )
        .run({
          id,
          name: payload.name,
          clientName: payload.clientName ?? "",
          platform: payload.platform ?? "",
          createdAt,
          updatedAt: now,
          dateRangeStart: payload.dateRangeStart ?? "",
          dateRangeEnd: payload.dateRangeEnd ?? ""
        });

      this.db.prepare("DELETE FROM datasets WHERE project_id = ?").run(id);
      this.db.prepare("DELETE FROM analyses WHERE project_id = ?").run(id);

      this.db
        .prepare(
          `INSERT INTO datasets (id, project_id, original_file_name, cleaned_data_json, row_count, column_mapping_json)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(randomUUID(), id, payload.originalFileName, JSON.stringify(payload.cleanedRows), payload.cleanedRows.length, JSON.stringify(payload.columnMapping));

      this.db
        .prepare(
          `INSERT INTO analyses (id, project_id, summary_json, kpi_json, recommendations_json, ai_insights_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          randomUUID(),
          id,
          JSON.stringify(payload.analysis),
          JSON.stringify(payload.analysis.overall),
          JSON.stringify(payload.analysis.recommendations),
          payload.aiInsights ? JSON.stringify(payload.aiInsights) : null,
          now
        );
    });

    transaction();
    return { ...payload, id, createdAt, updatedAt: now };
  }

  listProjects(): ProjectRecord[] {
    const rows = this.db.prepare("SELECT * FROM projects ORDER BY updated_at DESC").all() as ProjectRow[];
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      clientName: row.client_name,
      platform: row.platform,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      dateRangeStart: row.date_range_start,
      dateRangeEnd: row.date_range_end,
      originalFileName: "",
      cleanedRows: [],
      columnMapping: {},
      analysis: {
        overall: {
          totalSpend: 0,
          totalImpressions: 0,
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          totalLeads: 0,
          totalPurchases: 0,
          ctr: 0,
          cpc: null,
          cpm: null,
          cpa: null,
          roas: null,
          conversionRate: null,
          costPerLead: null,
          costPerPurchase: null,
          averageOrderValue: null,
          profitEstimate: null,
          wastedSpend: 0,
          campaignCount: 0
        },
        campaigns: [],
        trend: [],
        wastedSpend: [],
        recommendations: [],
        topCampaigns: [],
        worstCampaigns: []
      }
    }));
  }

  loadProject(id: string): ProjectRecord | null {
    const project = this.db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow | undefined;
    if (!project) return null;
    const dataset = this.db.prepare("SELECT * FROM datasets WHERE project_id = ? LIMIT 1").get(id) as DatasetRow | undefined;
    const analysis = this.db.prepare("SELECT * FROM analyses WHERE project_id = ? ORDER BY created_at DESC LIMIT 1").get(id) as AnalysisRow | undefined;
    if (!dataset || !analysis) return null;
    return {
      id: project.id,
      name: project.name,
      clientName: project.client_name,
      platform: project.platform,
      dateRangeStart: project.date_range_start,
      dateRangeEnd: project.date_range_end,
      originalFileName: dataset.original_file_name,
      cleanedRows: JSON.parse(dataset.cleaned_data_json),
      columnMapping: JSON.parse(dataset.column_mapping_json),
      analysis: JSON.parse(analysis.summary_json),
      aiInsights: analysis.ai_insights_json ? JSON.parse(analysis.ai_insights_json) : null,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    };
  }

  deleteProject(id: string): void {
    this.db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  }

  getSettings(encryptedApiKey?: string): AppSettings {
    const row = this.db.prepare("SELECT * FROM settings WHERE id = 'default'").get() as SettingsRow | undefined;
    if (!row) return defaultSettings;
    return {
      aiProvider: row.ai_provider,
      apiKey: encryptedApiKey,
      model: row.model,
      localAiBaseUrl: row.local_ai_base_url || defaultSettings.localAiBaseUrl,
      targets: JSON.parse(row.default_targets_json),
      branding: JSON.parse(row.branding_json),
      defaultCurrency: row.default_currency,
      dateFormat: row.date_format,
      defaultAttributionField: row.default_attribution_field,
      allowDetailedAiData: Boolean(row.allow_detailed_ai_data)
    };
  }

  getEncryptedApiKey(): string | undefined {
    const row = this.db.prepare("SELECT api_key_encrypted FROM settings WHERE id = 'default'").get() as { api_key_encrypted?: string } | undefined;
    return row?.api_key_encrypted;
  }

  saveSettings(settings: AppSettings, encryptedApiKey?: string): AppSettings {
    this.db
      .prepare(
        `INSERT INTO settings (
          id, ai_provider, api_key_encrypted, model, default_targets_json, branding_json,
          default_currency, date_format, default_attribution_field, allow_detailed_ai_data, local_ai_base_url
        ) VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          ai_provider = excluded.ai_provider,
          api_key_encrypted = excluded.api_key_encrypted,
          model = excluded.model,
          default_targets_json = excluded.default_targets_json,
          branding_json = excluded.branding_json,
          default_currency = excluded.default_currency,
          date_format = excluded.date_format,
          default_attribution_field = excluded.default_attribution_field,
          allow_detailed_ai_data = excluded.allow_detailed_ai_data,
          local_ai_base_url = excluded.local_ai_base_url`
      )
      .run(
        settings.aiProvider,
        encryptedApiKey ?? null,
        settings.model,
        JSON.stringify(settings.targets),
        JSON.stringify(settings.branding),
        settings.defaultCurrency,
        settings.dateFormat,
        settings.defaultAttributionField,
        settings.allowDetailedAiData ? 1 : 0,
        settings.localAiBaseUrl ?? defaultSettings.localAiBaseUrl
      );
    return settings;
  }

  appendChatExchange(input: {
    projectId?: string | null;
    sessionId?: string | null;
    title: string;
    userContent: string;
    assistantContent: string;
  }): AIChatSession {
    const now = new Date().toISOString();
    const sessionId = input.sessionId || randomUUID();
    const existing = this.db.prepare("SELECT * FROM ai_chat_sessions WHERE id = ?").get(sessionId) as ChatSessionRow | undefined;
    const createdAt = existing?.created_at ?? now;
    const title = existing?.title || input.title.slice(0, 96) || "AI Analyst Chat";

    const transaction = this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO ai_chat_sessions (id, project_id, title, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             project_id = COALESCE(excluded.project_id, ai_chat_sessions.project_id),
             title = ai_chat_sessions.title,
             updated_at = excluded.updated_at`
        )
        .run(sessionId, input.projectId ?? null, title, createdAt, now);

      this.db
        .prepare("INSERT INTO ai_chat_messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)")
        .run(randomUUID(), sessionId, "user", input.userContent, now);
      this.db
        .prepare("INSERT INTO ai_chat_messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)")
        .run(randomUUID(), sessionId, "assistant", input.assistantContent, new Date(Date.now() + 1).toISOString());
    });

    transaction();
    const session = this.getChatSession(sessionId);
    if (!session) throw new Error("AI chat session could not be saved.");
    return session;
  }

  listChatSessions(projectId?: string | null): AIChatSession[] {
    const rows = projectId
      ? (this.db.prepare("SELECT * FROM ai_chat_sessions WHERE project_id = ? ORDER BY updated_at DESC").all(projectId) as ChatSessionRow[])
      : (this.db.prepare("SELECT * FROM ai_chat_sessions WHERE project_id IS NULL ORDER BY updated_at DESC").all() as ChatSessionRow[]);
    return rows.map((row) => this.hydrateChatSession(row));
  }

  getChatSession(sessionId: string): AIChatSession | null {
    const row = this.db.prepare("SELECT * FROM ai_chat_sessions WHERE id = ?").get(sessionId) as ChatSessionRow | undefined;
    return row ? this.hydrateChatSession(row) : null;
  }

  clearChatSession(sessionId: string): void {
    this.db.prepare("DELETE FROM ai_chat_sessions WHERE id = ?").run(sessionId);
  }

  private hydrateChatSession(row: ChatSessionRow): AIChatSession {
    const messages = this.db.prepare("SELECT * FROM ai_chat_messages WHERE session_id = ? ORDER BY created_at ASC").all(row.id) as ChatMessageRow[];
    return {
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      messages: messages.map((message) => ({
        id: message.id,
        sessionId: message.session_id,
        role: message.role,
        content: message.content,
        createdAt: message.created_at
      }))
    };
  }
}
