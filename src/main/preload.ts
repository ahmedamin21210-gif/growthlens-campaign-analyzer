import { contextBridge, ipcRenderer } from "electron";
import type { AIInsightPayload } from "../shared/ai";
import { isAppErrorPayload, isIpcResult, type AppErrorPayload } from "../shared/appErrors";
import type { AIChatRequest, AIChatResponse, AIChatSession, AppSettings, ParsedCampaignFile, ProjectPayload, ProjectRecord } from "../shared/types";

async function invokeCampaign<T>(channel: string, ...args: unknown[]): Promise<T> {
  const response = await ipcRenderer.invoke(channel, ...args);
  if (isIpcResult<T>(response)) {
    if (response.ok) return response.data;
    throw Object.assign(new Error(response.error.message), { payload: response.error });
  }
  return response as T;
}

const api = {
  pickCampaignFile: (): Promise<ParsedCampaignFile | null> => invokeCampaign("campaign:pickFile"),
  parseCampaignFile: (filePath: string): Promise<ParsedCampaignFile> => invokeCampaign("campaign:parseFile", filePath),
  saveProject: (payload: ProjectPayload): Promise<ProjectRecord> => invokeCampaign("campaign:saveProject", payload),
  listProjects: (): Promise<ProjectRecord[]> => invokeCampaign("campaign:listProjects"),
  loadProject: (id: string): Promise<ProjectRecord | null> => invokeCampaign("campaign:loadProject", id),
  deleteProject: (id: string): Promise<void> => invokeCampaign("campaign:deleteProject", id),
  generateAiInsights: (payload: AIInsightPayload): Promise<ProjectPayload["aiInsights"]> => invokeCampaign("campaign:generateAiInsights", payload),
  generateAiInsightsV1: (payload: AIInsightPayload): Promise<ProjectPayload["aiInsights"]> => invokeCampaign("campaign:generateAiInsightsV1", payload),
  sendAiChatMessage: (payload: AIChatRequest): Promise<AIChatResponse> => invokeCampaign("campaign:chat", payload),
  listChatSessions: (projectId?: string | null): Promise<AIChatSession[]> => invokeCampaign("campaign:listChatSessions", projectId),
  clearChatSession: (sessionId: string): Promise<void> => invokeCampaign("campaign:clearChatSession", sessionId),
  exportPdf: (payload: {
    title: string;
    dateRange?: string;
    analysis: ProjectPayload["analysis"];
    aiInsights?: ProjectPayload["aiInsights"];
    branding: AppSettings["branding"];
  }): Promise<string | null> => invokeCampaign("campaign:exportPdf", payload),
  getSettings: (): Promise<AppSettings> => invokeCampaign("campaign:getSettings"),
  saveSettings: (settings: AppSettings): Promise<AppSettings> => invokeCampaign("campaign:saveSettings", settings),
  testAiConnection: (settings: AppSettings): Promise<{ ok: boolean; message: string }> => invokeCampaign("campaign:testAiConnection", settings),
  diagnostics: (): Promise<{ appVersion: string; releaseLabel: string; dataDirectory: string; logFile: string; secureStorageAvailable: boolean; aiConfigured: boolean }> =>
    invokeCampaign("campaign:diagnostics")
};

contextBridge.exposeInMainWorld("campaignAnalyzer", api);

declare global {
  interface Error {
    payload?: AppErrorPayload;
  }
}

export type CampaignAnalyzerApi = typeof api;
export { isAppErrorPayload };
