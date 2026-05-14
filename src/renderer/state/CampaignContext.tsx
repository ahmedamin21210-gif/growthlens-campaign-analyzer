import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isAppErrorPayload } from "@shared/appErrors";
import { fallbackInsights } from "@shared/ai";
import { detectColumns, mappingCompleteness } from "@shared/columnDetection";
import { cleanCampaignData } from "@shared/dataCleaning";
import { parseByExtension } from "@shared/fileParsing";
import { analyzeCampaigns } from "@shared/kpiEngine";
import {
  defaultSettings,
  type AIChatSession,
  type AIInsightResponse,
  type AnalysisSummary,
  type AppSettings,
  type CleaningResult,
  type ColumnDetectionResult,
  type ColumnMapping,
  type ParsedCampaignFile,
  type ProjectPayload,
  type ProjectRecord
} from "@shared/types";

type CampaignContextValue = {
  parsedFile: ParsedCampaignFile | null;
  detection: ColumnDetectionResult | null;
  mapping: ColumnMapping;
  cleaning: CleaningResult | null;
  analysis: AnalysisSummary | null;
  aiInsights: AIInsightResponse | null;
  settings: AppSettings;
  projects: ProjectRecord[];
  activeProject: ProjectRecord | null;
  chatSessions: AIChatSession[];
  activeChatSessionId: string | null;
  loading: string | null;
  error: string | null;
  notice: string | null;
  mappingScore: number;
  processParsedFile: (parsed: ParsedCampaignFile) => void;
  pickFile: () => Promise<boolean>;
  parseDroppedFile: (file: File) => Promise<boolean>;
  loadSampleData: () => Promise<boolean>;
  applyMapping: (mapping: ColumnMapping) => boolean;
  generateInsights: () => Promise<void>;
  sendChatMessage: (question: string) => Promise<boolean>;
  clearChatSession: (sessionId: string) => Promise<void>;
  selectChatSession: (sessionId: string | null) => void;
  exportPdf: () => Promise<string | null>;
  saveCurrentProject: (name?: string, clientName?: string) => Promise<ProjectRecord | null>;
  refreshProjects: () => Promise<void>;
  loadProject: (id: string) => Promise<boolean>;
  deleteProject: (id: string) => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  testAiConnection: (settings: AppSettings) => Promise<{ ok: boolean; message: string }>;
  diagnostics: () => Promise<{ appVersion: string; releaseLabel: string; dataDirectory: string; logFile: string; secureStorageAvailable: boolean; aiConfigured: boolean } | null>;
  clearError: () => void;
  clearNotice: () => void;
};

const CampaignContext = createContext<CampaignContextValue | null>(null);

function friendlyError(error: unknown): string {
  if (error && typeof error === "object" && "payload" in error && isAppErrorPayload((error as { payload?: unknown }).payload)) {
    const payload = (error as { payload: { message: string; suggested_action?: string; operation_id: string } }).payload;
    return `${payload.message}${payload.suggested_action ? ` ${payload.suggested_action}` : ""} (Ref: ${payload.operation_id})`;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

function dateRange(rows: ProjectPayload["cleanedRows"]): { start?: string; end?: string } {
  const dates = rows.map((row) => row.date).filter((date): date is string => Boolean(date)).sort();
  return { start: dates[0], end: dates[dates.length - 1] };
}

function extension(fileName: string): string {
  return fileName.toLowerCase().split(".").pop() ?? "";
}

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [parsedFile, setParsedFile] = useState<ParsedCampaignFile | null>(null);
  const [detection, setDetection] = useState<ColumnDetectionResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [cleaning, setCleaning] = useState<CleaningResult | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisSummary | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsightResponse | null>(null);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectRecord | null>(null);
  const [chatSessions, setChatSessions] = useState<AIChatSession[]>([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refreshProjects = useCallback(async () => {
    if (!window.campaignAnalyzer) return;
    setProjects(await window.campaignAnalyzer.listProjects());
  }, []);

  const refreshChatSessions = useCallback(async (projectId?: string | null) => {
    if (!window.campaignAnalyzer) return;
    const sessions = await window.campaignAnalyzer.listChatSessions(projectId ?? null);
    setChatSessions(sessions);
    setActiveChatSessionId((current) => (current && sessions.some((session) => session.id === current) ? current : sessions[0]?.id ?? null));
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        if (!window.campaignAnalyzer) return;
        setSettings(await window.campaignAnalyzer.getSettings());
        await refreshProjects();
      } catch (err) {
        setError(friendlyError(err));
      }
    })();
  }, [refreshProjects]);

  const processParsedFile = useCallback((parsed: ParsedCampaignFile) => {
    const nextDetection = detectColumns(parsed.headers);
    setParsedFile(parsed);
    setDetection(nextDetection);
    setMapping(nextDetection.mapping);
    setCleaning(null);
    setAnalysis(null);
    setAiInsights(null);
    setActiveProject(null);
    setChatSessions([]);
    setActiveChatSessionId(null);
    setError(null);
  }, []);

  const pickFile = useCallback(async () => {
    try {
      setLoading("Opening file");
      if (!window.campaignAnalyzer) throw new Error("Desktop API unavailable. Run the Electron app to upload, save, export, and use AI features.");
      const parsed = await window.campaignAnalyzer.pickCampaignFile();
      if (!parsed) return false;
      processParsedFile(parsed);
      return true;
    } catch (err) {
      setError(friendlyError(err));
      return false;
    } finally {
      setLoading(null);
    }
  }, [processParsedFile]);

  const parseDroppedFile = useCallback(
    async (file: File) => {
      try {
        setLoading("Parsing file");
        if (!["csv", "xlsx", "xls"].includes(extension(file.name))) {
          throw new Error("Please upload a CSV, XLSX, or XLS campaign export.");
        }
        if (file.size > 25 * 1024 * 1024) {
          throw new Error("This file is larger than the 25 MB desktop limit. Export a smaller date range or split the file before importing.");
        }
        const content = extension(file.name) === "csv" ? await file.text() : await file.arrayBuffer();
        processParsedFile(parseByExtension(file.name, content));
        return true;
      } catch (err) {
        setError(friendlyError(err));
        return false;
      } finally {
        setLoading(null);
      }
    },
    [processParsedFile]
  );

  const loadSampleData = useCallback(async () => {
    try {
      setLoading("Loading sample data");
      const response = await fetch("/sample-data/campaign_sample.csv");
      if (!response.ok) throw new Error("Sample campaign data could not be loaded.");
      const text = await response.text();
      processParsedFile(parseByExtension("campaign_sample.csv", text));
      return true;
    } catch (err) {
      setError(friendlyError(err));
      return false;
    } finally {
      setLoading(null);
    }
  }, [processParsedFile]);

  const applyMapping = useCallback(
    (nextMapping: ColumnMapping) => {
      if (!parsedFile) {
        setError("Upload a campaign file before mapping columns.");
        return false;
      }
      const nextCleaning = cleanCampaignData(parsedFile.rows, nextMapping);
      setMapping(nextMapping);
      setCleaning(nextCleaning);
      if (nextCleaning.errors.length > 0) {
        setAnalysis(null);
        setError(nextCleaning.errors[0]?.message ?? "The uploaded data could not be analyzed.");
        return false;
      }
      const nextAnalysis = analyzeCampaigns(nextCleaning.rows, settings.targets);
      setAnalysis(nextAnalysis);
      setAiInsights(null);
      setChatSessions([]);
      setActiveChatSessionId(null);
      setError(null);
      return true;
    },
    [parsedFile, settings.targets]
  );

  const generateInsights = useCallback(async () => {
    if (!analysis) {
      setError("Analyze a campaign file before generating AI insights.");
      return;
    }
    try {
      setLoading("Generating AI insights");
      const insights = window.campaignAnalyzer
        ? await window.campaignAnalyzer.generateAiInsightsV1({
            analysis,
            targets: settings.targets,
            cleanedRows: settings.allowDetailedAiData ? cleaning?.rows : undefined,
            allowDetailedAiData: settings.allowDetailedAiData
          })
        : fallbackInsights(analysis);
      setAiInsights(insights ?? null);
      setNotice(insights?.fallback ? "Decision Panel generated from deterministic GrowthLens analysis." : "Decision Panel generated successfully.");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(null);
    }
  }, [analysis, cleaning?.rows, settings.allowDetailedAiData, settings.targets]);

  const sendChatMessage = useCallback(
    async (question: string) => {
      if (!analysis) {
        setError("Run a campaign analysis before using AI Analyst Chat.");
        return false;
      }
      if (settings.aiProvider === "disabled" || !settings.hasStoredApiKey) {
        setError("Enable OpenAI or Anthropic and save an API key in Settings to use AI Analyst Chat.");
        return false;
      }
      try {
        setLoading("Asking AI Analyst");
        if (!window.campaignAnalyzer) throw new Error("Desktop API unavailable. Run the Electron app before using AI Analyst Chat.");
        const response = await window.campaignAnalyzer.sendAiChatMessage({
          projectId: activeProject?.id ?? null,
          sessionId: activeChatSessionId,
          question,
          analysis,
          targets: settings.targets,
          aiInsights,
          cleanedRows: settings.allowDetailedAiData ? cleaning?.rows : undefined,
          allowDetailedAiData: settings.allowDetailedAiData
        });
        setChatSessions((sessions) => {
          const otherSessions = sessions.filter((session) => session.id !== response.session.id);
          return [response.session, ...otherSessions];
        });
        setActiveChatSessionId(response.session.id);
        setNotice("AI Analyst response generated.");
        return true;
      } catch (err) {
        setError(friendlyError(err));
        return false;
      } finally {
        setLoading(null);
      }
    },
    [activeChatSessionId, activeProject?.id, aiInsights, analysis, cleaning?.rows, settings.allowDetailedAiData, settings.aiProvider, settings.hasStoredApiKey, settings.targets]
  );

  const saveCurrentProject = useCallback(
    async (name?: string, clientName?: string) => {
      if (!parsedFile || !cleaning || !analysis) {
        setError("Analyze a campaign file before saving the project.");
        return null;
      }
      try {
        setLoading("Saving project");
        if (!window.campaignAnalyzer) throw new Error("Desktop API unavailable. Run the Electron app before saving workspaces.");
        const range = dateRange(cleaning.rows);
        const payload: ProjectPayload = {
          id: activeProject?.id,
          name: name || activeProject?.name || parsedFile.fileName.replace(/\.[^.]+$/, ""),
          clientName: clientName ?? activeProject?.clientName ?? settings.branding.clientName,
          platform: parsedFile.detectedPlatform ?? detection?.detectedPlatform,
          dateRangeStart: range.start,
          dateRangeEnd: range.end,
          originalFileName: parsedFile.fileName,
          cleanedRows: cleaning.rows,
          columnMapping: mapping,
          analysis,
          aiInsights
        };
        const saved = await window.campaignAnalyzer.saveProject(payload);
        setActiveProject(saved);
        await refreshProjects();
        await refreshChatSessions(saved.id);
        setNotice("Workspace saved.");
        return saved;
      } catch (err) {
        setError(friendlyError(err));
        return null;
      } finally {
        setLoading(null);
      }
    },
    [activeProject, aiInsights, analysis, cleaning, detection, mapping, parsedFile, refreshChatSessions, refreshProjects, settings.branding.clientName]
  );

  const loadProject = useCallback(async (id: string) => {
    try {
      setLoading("Loading project");
      if (!window.campaignAnalyzer) throw new Error("Desktop API unavailable. Run the Electron app before opening workspaces.");
      const project = await window.campaignAnalyzer.loadProject(id);
      if (!project) throw new Error("Saved project could not be found.");
      setActiveProject(project);
      setParsedFile({
        fileName: project.originalFileName,
        rowCount: project.cleanedRows.length,
        columnCount: Object.keys(project.columnMapping).length,
        headers: Object.values(project.columnMapping).filter((value): value is string => Boolean(value)),
        rows: [],
        previewRows: [],
        detectedPlatform: project.platform,
        warnings: []
      });
      setDetection(null);
      setMapping(project.columnMapping);
      setCleaning({ rows: project.cleanedRows, warnings: [], errors: [], duplicateRows: 0, removedRows: 0, missingValueCount: 0 });
      setAnalysis(project.analysis);
      setAiInsights(project.aiInsights ?? null);
      await refreshChatSessions(project.id);
      setError(null);
      return true;
    } catch (err) {
      setError(friendlyError(err));
      return false;
    } finally {
      setLoading(null);
    }
  }, [refreshChatSessions]);

  const deleteProject = useCallback(
    async (id: string) => {
      try {
        setLoading("Deleting workspace");
        if (!window.campaignAnalyzer) throw new Error("Desktop API unavailable. Run the Electron app before deleting workspaces.");
        await window.campaignAnalyzer.deleteProject(id);
        if (activeProject?.id === id) setActiveProject(null);
        if (activeProject?.id === id) {
          setChatSessions([]);
          setActiveChatSessionId(null);
        }
        await refreshProjects();
        setNotice("Workspace deleted.");
      } catch (err) {
        setError(friendlyError(err));
      } finally {
        setLoading(null);
      }
    },
    [activeProject?.id, refreshProjects]
  );

  const saveSettings = useCallback(async (nextSettings: AppSettings) => {
    try {
      setLoading("Saving settings");
      if (!window.campaignAnalyzer) throw new Error("Desktop API unavailable. Run the Electron app before saving settings.");
      const saved = await window.campaignAnalyzer.saveSettings(nextSettings);
      setSettings(saved);
      if (cleaning?.rows.length) {
        setAnalysis(analyzeCampaigns(cleaning.rows, saved.targets));
      }
      setNotice("Settings saved.");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(null);
    }
  }, [cleaning?.rows]);

  const clearChatSession = useCallback(
    async (sessionId: string) => {
      try {
        setLoading("Clearing AI chat");
        if (!window.campaignAnalyzer) throw new Error("Desktop API unavailable. Run the Electron app before clearing AI chat.");
        await window.campaignAnalyzer.clearChatSession(sessionId);
        await refreshChatSessions(activeProject?.id ?? null);
        setNotice("AI chat cleared.");
      } catch (err) {
        setError(friendlyError(err));
      } finally {
        setLoading(null);
      }
    },
    [activeProject?.id, refreshChatSessions]
  );

  const testAiConnection = useCallback((nextSettings: AppSettings) => {
    if (!window.campaignAnalyzer) return Promise.resolve({ ok: false, message: "Desktop API unavailable. Run the Electron app before testing AI." });
    return window.campaignAnalyzer.testAiConnection(nextSettings);
  }, []);

  const diagnostics = useCallback(async () => {
    if (!window.campaignAnalyzer) return null;
    try {
      return await window.campaignAnalyzer.diagnostics();
    } catch (err) {
      setError(friendlyError(err));
      return null;
    }
  }, []);

  const exportPdf = useCallback(async () => {
    if (!analysis) {
      setError("Analyze a campaign file before exporting a PDF report.");
      return null;
    }
    try {
      setLoading("Exporting PDF");
      if (!window.campaignAnalyzer) throw new Error("Desktop API unavailable. Run the Electron app before exporting PDF reports.");
      const filePath = await window.campaignAnalyzer.exportPdf({
        title: `${activeProject?.name ?? parsedFile?.fileName?.replace(/\.[^.]+$/, "") ?? "Campaign"} Executive Brief`,
        dateRange: [activeProject?.dateRangeStart, activeProject?.dateRangeEnd].filter(Boolean).join(" - "),
        analysis,
        aiInsights,
        branding: settings.branding
      });
      if (filePath) setNotice("Executive Brief exported.");
      return filePath;
    } catch (err) {
      setError(friendlyError(err));
      return null;
    } finally {
      setLoading(null);
    }
  }, [activeProject, aiInsights, analysis, parsedFile?.fileName, settings.branding]);

  const value = useMemo<CampaignContextValue>(
    () => ({
      parsedFile,
      detection,
      mapping,
      cleaning,
      analysis,
      aiInsights,
      settings,
      projects,
      activeProject,
      chatSessions,
      activeChatSessionId,
      loading,
      error,
      notice,
      mappingScore: mappingCompleteness(mapping),
      processParsedFile,
      pickFile,
      parseDroppedFile,
      loadSampleData,
      applyMapping,
      generateInsights,
      sendChatMessage,
      clearChatSession,
      selectChatSession: setActiveChatSessionId,
      exportPdf,
      saveCurrentProject,
      refreshProjects,
      loadProject,
      deleteProject,
      saveSettings,
      testAiConnection,
      diagnostics,
      clearError: () => setError(null),
      clearNotice: () => setNotice(null)
    }),
    [
      activeProject,
      activeChatSessionId,
      aiInsights,
      analysis,
      applyMapping,
      chatSessions,
      cleaning,
      clearChatSession,
      deleteProject,
      detection,
      error,
      exportPdf,
      generateInsights,
      loadProject,
      loadSampleData,
      loading,
      mapping,
      notice,
      parseDroppedFile,
      parsedFile,
      pickFile,
      processParsedFile,
      projects,
      refreshProjects,
      saveCurrentProject,
      saveSettings,
      sendChatMessage,
      settings,
      testAiConnection,
      diagnostics
    ]
  );

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (!context) throw new Error("useCampaign must be used inside CampaignProvider");
  return context;
}
