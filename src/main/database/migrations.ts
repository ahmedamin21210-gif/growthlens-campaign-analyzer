import type Database from "better-sqlite3";

export function runMigrations(db: Database.Database): void {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client_name TEXT,
      platform TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      date_range_start TEXT,
      date_range_end TEXT
    );

    CREATE TABLE IF NOT EXISTS datasets (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      original_file_name TEXT NOT NULL,
      cleaned_data_json TEXT NOT NULL,
      row_count INTEGER NOT NULL,
      column_mapping_json TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      summary_json TEXT NOT NULL,
      kpi_json TEXT NOT NULL,
      recommendations_json TEXT NOT NULL,
      ai_insights_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      ai_provider TEXT NOT NULL,
      api_key_encrypted TEXT,
      model TEXT NOT NULL,
      default_targets_json TEXT NOT NULL,
      branding_json TEXT NOT NULL,
      default_currency TEXT NOT NULL,
      date_format TEXT NOT NULL,
      default_attribution_field TEXT NOT NULL,
      allow_detailed_ai_data INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS mapping_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      platform TEXT,
      mapping_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_chat_sessions (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(session_id) REFERENCES ai_chat_sessions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_datasets_project_id ON datasets(project_id);
    CREATE INDEX IF NOT EXISTS idx_analyses_project_created ON analyses(project_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_project_updated ON ai_chat_sessions(project_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_created ON ai_chat_messages(session_id, created_at ASC);
  `);
}
