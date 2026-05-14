/// <reference types="vite/client" />

import type { AIInsightPayload } from "@shared/ai";
import type { AIChatRequest, AIChatResponse, AIChatSession, AppSettings, ParsedCampaignFile, ProjectPayload, ProjectRecord } from "@shared/types";

declare global {
  interface Window {
    campaignAnalyzer: {
      pickCampaignFile: () => Promise<ParsedCampaignFile | null>;
      parseCampaignFile: (filePath: string) => Promise<ParsedCampaignFile>;
      saveProject: (payload: ProjectPayload) => Promise<ProjectRecord>;
      listProjects: () => Promise<ProjectRecord[]>;
      loadProject: (id: string) => Promise<ProjectRecord | null>;
      deleteProject: (id: string) => Promise<void>;
      generateAiInsights: (payload: AIInsightPayload) => Promise<ProjectPayload["aiInsights"]>;
      generateAiInsightsV1: (payload: AIInsightPayload) => Promise<ProjectPayload["aiInsights"]>;
      sendAiChatMessage: (payload: AIChatRequest) => Promise<AIChatResponse>;
      listChatSessions: (projectId?: string | null) => Promise<AIChatSession[]>;
      clearChatSession: (sessionId: string) => Promise<void>;
      exportPdf: (payload: {
        title: string;
        dateRange?: string;
        analysis: ProjectPayload["analysis"];
        aiInsights?: ProjectPayload["aiInsights"];
        branding: AppSettings["branding"];
      }) => Promise<string | null>;
      getSettings: () => Promise<AppSettings>;
      saveSettings: (settings: AppSettings) => Promise<AppSettings>;
      testAiConnection: (settings: AppSettings) => Promise<{ ok: boolean; message: string }>;
      diagnostics: () => Promise<{ appVersion: string; releaseLabel: string; dataDirectory: string; logFile: string; secureStorageAvailable: boolean; aiConfigured: boolean }>;
    };
  }
}
