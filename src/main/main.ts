import { app, BrowserWindow, dialog, ipcMain, safeStorage } from "electron";
import type { OpenDialogOptions, SaveDialogOptions } from "electron";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";
import { buildChatPrompt, buildInsightPromptV1, fallbackInsightsV1, parseAIResponseV1, type AIInsightPayload } from "../shared/ai";
import { appError, createOperationId, toAppErrorPayload, type IpcResult } from "../shared/appErrors";
import {
  assertProjectId,
  validateAiChatRequest,
  validateAiInsightPayload,
  validatePdfExportPayload,
  validateProjectPayload,
  validateSettings,
  type PdfExportPayload
} from "../shared/campaignValidation";
import { parseByExtension } from "../shared/fileParsing";
import type { AIChatRequest, AIChatResponse, AppSettings, ParsedCampaignFile, ProjectPayload, ProjectRecord } from "../shared/types";
import { AppDatabase } from "./database/sqlite";
import { buildReportHtml } from "./reportHtml";

let mainWindow: BrowserWindow | null = null;
let database: AppDatabase;
let logPath = "";

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 980,
    minWidth: 1120,
    minHeight: 720,
    title: "GrowthLens Campaign Analyzer",
    backgroundColor: "#f8fafc",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    void mainWindow.loadURL(devUrl);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
}

function ensureRuntimeDirs(): void {
  const logDir = path.join(app.getPath("userData"), "logs");
  fs.mkdirSync(logDir, { recursive: true });
  logPath = path.join(logDir, "growthlens-campaign.log");
}

function logEvent(event: string, details: Record<string, unknown> = {}): void {
  try {
    const safeDetails = { ...details };
    delete safeDetails.apiKey;
    delete safeDetails.cleanedRows;
    fs.appendFileSync(logPath, `${JSON.stringify({ at: new Date().toISOString(), event, ...safeDetails })}\n`);
  } catch {
    // Local diagnostics should never interrupt the user workflow.
  }
}

function encryptApiKey(apiKey?: string): string | undefined {
  if (!apiKey) return undefined;
  if (!safeStorage.isEncryptionAvailable()) {
    throw appError("PERMISSION_DENIED", "Secure API key storage is unavailable on this system.", {
      suggestedAction: "Use AI disabled mode, or run the app in an environment where Electron safeStorage is available."
    });
  }
  return `safe:${safeStorage.encryptString(apiKey).toString("base64")}`;
}

function decryptApiKey(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    if (value.startsWith("safe:")) return safeStorage.decryptString(Buffer.from(value.slice(5), "base64"));
  } catch {
    return undefined;
  }
  return undefined;
}

function getEnvironmentApiKey(provider: AppSettings["aiProvider"]): string | undefined {
  if (provider === "openai") return process.env.OPENAI_API_KEY;
  if (provider === "anthropic") return process.env.ANTHROPIC_API_KEY;
  if (provider === "google") return process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  return undefined;
}

function providerRequiresApiKey(provider: AppSettings["aiProvider"]): boolean {
  return provider === "openai" || provider === "anthropic" || provider === "google";
}

function defaultModel(provider: AppSettings["aiProvider"]): string {
  if (provider === "anthropic") return "claude-3-5-haiku-latest";
  if (provider === "google") return "gemini-1.5-flash";
  if (provider === "ollama") return "llama3.1";
  return "gpt-4o-mini";
}

function getSettingsWithKey(): AppSettings {
  const base = database.getSettings();
  const stored = decryptApiKey(database.getEncryptedApiKey());
  const envKey = getEnvironmentApiKey(base.aiProvider);
  const apiKey = stored ?? envKey;
  return { ...base, apiKey, localAiBaseUrl: base.localAiBaseUrl || process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434", hasStoredApiKey: Boolean(stored) };
}

function getSettingsForRenderer(): AppSettings {
  const settings = getSettingsWithKey();
  return {
    ...settings,
    apiKey: undefined,
    hasStoredApiKey: settings.aiProvider === "ollama" || Boolean(settings.hasStoredApiKey || getEnvironmentApiKey(settings.aiProvider))
  };
}

function friendlyError(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "Something went wrong.";
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => reject(appError("AI_PROVIDER_ERROR", `${label} timed out.`, { suggestedAction: "Try again or choose a faster model." })), timeoutMs);
      })
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function callGoogleText(settings: AppSettings, apiKey: string, prompt: string, system?: string, jsonMode = false): Promise<string> {
  const model = settings.model || defaultModel("google");
  const response = await withTimeout(
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: jsonMode ? "application/json" : "text/plain"
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    }),
    30_000,
    "Google Gemini"
  );
  if (!response.ok) throw new Error(`Google Gemini returned HTTP ${response.status}`);
  const json = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n").trim() ?? "";
}

async function callOllamaText(settings: AppSettings, messages: Array<{ role: "system" | "user" | "assistant"; content: string }>, label: string): Promise<string> {
  const baseUrl = (settings.localAiBaseUrl || "http://127.0.0.1:11434").replace(/\/$/, "");
  const response = await withTimeout(
    fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: settings.model || defaultModel("ollama"),
        stream: false,
        messages,
        options: { temperature: 0.2 }
      })
    }),
    45_000,
    label
  );
  if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}. Make sure Ollama is running at ${baseUrl}.`);
  const json = (await response.json()) as { message?: { content?: string }; response?: string };
  return (json.message?.content ?? json.response ?? "").trim();
}

function parseCampaignFileFromPath(filePath: string): ParsedCampaignFile {
  const normalized = path.resolve(filePath);
  if (!fs.existsSync(normalized)) {
    throw appError("NOT_FOUND", "We could not find that file.", { suggestedAction: "Choose the campaign export again." });
  }
  const stat = fs.statSync(normalized);
  if (!stat.isFile()) {
    throw appError("VALIDATION_ERROR", "Choose a campaign export file, not a folder.");
  }
  if (stat.size === 0) {
    throw appError("VALIDATION_ERROR", "This file is empty.", { suggestedAction: "Export campaign rows from your ads platform and try again." });
  }
  if (stat.size > 25 * 1024 * 1024) {
    throw appError("VALIDATION_ERROR", "This file is larger than the 25 MB desktop limit.", {
      suggestedAction: "Export a smaller date range or split the file before importing."
    });
  }
  const extension = path.extname(normalized).toLowerCase();
  if (![".csv", ".xlsx", ".xls"].includes(extension)) {
    throw appError("UNSUPPORTED_FORMAT", "Please choose a CSV, XLSX, or XLS campaign export.");
  }
  const content = extension === ".csv" ? fs.readFileSync(normalized, "utf8") : fs.readFileSync(normalized);
  return parseByExtension(path.basename(normalized), content, normalized);
}

async function pickCampaignFile(): Promise<ParsedCampaignFile | null> {
  const options: OpenDialogOptions = {
    title: "Upload Campaign Data",
    properties: ["openFile"],
    filters: [{ name: "Campaign data", extensions: ["csv", "xlsx", "xls"] }]
  };
  const result = mainWindow ? await dialog.showOpenDialog(mainWindow, options) : await dialog.showOpenDialog(options);
  if (result.canceled || !result.filePaths[0]) return null;
  return parseCampaignFileFromPath(result.filePaths[0]);
}

async function generateAiInsights(payload: AIInsightPayload): Promise<ProjectPayload["aiInsights"]> {
  const validated = validateAiInsightPayload(payload);
  const settings = getSettingsWithKey();
  const aiPayload = {
    ...validated,
    allowDetailedAiData: settings.allowDetailedAiData && Boolean(validated.allowDetailedAiData)
  };
  if (settings.aiProvider === "disabled") return fallbackInsightsV1(validated.analysis);
  if (providerRequiresApiKey(settings.aiProvider) && !settings.apiKey) {
    return {
      ...fallbackInsightsV1(validated.analysis),
      executive_summary: "AI is not configured, so this Decision Panel uses deterministic GrowthLens rule-based analysis."
    };
  }

  const prompt = buildInsightPromptV1(aiPayload);
  try {
    if (settings.aiProvider === "openai") {
      const client = new OpenAI({ apiKey: settings.apiKey });
      const response = await withTimeout(
        client.chat.completions.create({
          model: settings.model || defaultModel("openai"),
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "Return valid JSON. Only use the provided campaign metrics." },
            { role: "user", content: prompt }
          ]
        }),
        30_000,
        "OpenAI Decision Panel"
      );
      return {
        ...parseAIResponseV1(response.choices[0]?.message?.content ?? "{}"),
        generated_at: new Date().toISOString(),
        provider: "openai",
        model: settings.model || defaultModel("openai"),
        fallback: false
      };
    }

    if (settings.aiProvider === "google") {
      const text = await callGoogleText(settings, settings.apiKey ?? "", prompt, "Return valid JSON. Only use the provided campaign metrics.", true);
      return {
        ...parseAIResponseV1(text),
        generated_at: new Date().toISOString(),
        provider: "google",
        model: settings.model || defaultModel("google"),
        fallback: false
      };
    }

    if (settings.aiProvider === "ollama") {
      const text = await callOllamaText(
        settings,
        [
          { role: "system", content: "Return valid JSON. Only use the provided campaign metrics." },
          { role: "user", content: prompt }
        ],
        "Ollama Decision Panel"
      );
      return {
        ...parseAIResponseV1(text),
        generated_at: new Date().toISOString(),
        provider: "ollama",
        model: settings.model || defaultModel("ollama"),
        fallback: false
      };
    }

    const client = new Anthropic({ apiKey: settings.apiKey });
    const response = await withTimeout(
      client.messages.create({
        model: settings.model || defaultModel("anthropic"),
        max_tokens: 2000,
        temperature: 0.2,
        system: "Return valid JSON. Only use the provided campaign metrics.",
        messages: [{ role: "user", content: prompt }]
      }),
      30_000,
      "Anthropic Decision Panel"
    );
    const text = response.content.map((block) => ("text" in block ? block.text : "")).join("\n");
    return {
      ...parseAIResponseV1(text),
      generated_at: new Date().toISOString(),
      provider: "anthropic",
      model: settings.model || defaultModel("anthropic"),
      fallback: false
    };
  } catch (error) {
    logEvent("ai.insights_failed", { error: friendlyError(error) });
    return {
      ...fallbackInsightsV1(validated.analysis, friendlyError(error)),
      executive_summary: `AI provider failed, so GrowthLens used deterministic rule-based analysis. ${friendlyError(error)}`
    };
  }
}

async function sendAiChatMessage(payload: AIChatRequest): Promise<AIChatResponse> {
  const validated = validateAiChatRequest(payload);
  const settings = getSettingsWithKey();
  if (settings.aiProvider === "disabled" || (providerRequiresApiKey(settings.aiProvider) && !settings.apiKey)) {
    throw appError("AI_NOT_CONFIGURED", "AI Analyst Chat is not configured.", {
      suggestedAction: "Choose OpenAI, Anthropic, Google, or Ollama in Settings and configure the required connection."
    });
  }

  const existingSession = validated.sessionId ? database.getChatSession(validated.sessionId) : null;
  const prompt = buildChatPrompt(
    {
      ...validated,
      allowDetailedAiData: settings.allowDetailedAiData && Boolean(validated.allowDetailedAiData)
    },
    existingSession?.messages ?? []
  );

  try {
    let answer = "";
    if (settings.aiProvider === "openai") {
      const client = new OpenAI({ apiKey: settings.apiKey });
      const response = await withTimeout(
        client.chat.completions.create({
          model: settings.model || defaultModel("openai"),
          temperature: 0.2,
          messages: [
            { role: "system", content: prompt.system },
            ...(existingSession?.messages.slice(-8).map((message) => ({ role: message.role, content: message.content })) ?? []),
            { role: "user", content: prompt.user }
          ]
        }),
        30_000,
        "OpenAI Analyst Chat"
      );
      answer = response.choices[0]?.message?.content?.trim() ?? "";
    } else if (settings.aiProvider === "google") {
      answer = await callGoogleText(settings, settings.apiKey ?? "", prompt.user, prompt.system, false);
    } else if (settings.aiProvider === "ollama") {
      answer = await callOllamaText(
        settings,
        [
          { role: "system", content: prompt.system },
          ...(existingSession?.messages.slice(-8).map((message) => ({ role: message.role as "user" | "assistant", content: message.content })) ?? []),
          { role: "user", content: prompt.user }
        ],
        "Ollama Analyst Chat"
      );
    } else {
      const client = new Anthropic({ apiKey: settings.apiKey });
      const response = await withTimeout(
        client.messages.create({
          model: settings.model || defaultModel("anthropic"),
          max_tokens: 1600,
          temperature: 0.2,
          system: prompt.system,
          messages: [
            ...(existingSession?.messages.slice(-8).map((message) => ({ role: message.role as "user" | "assistant", content: message.content })) ?? []),
            { role: "user", content: prompt.user }
          ]
        }),
        30_000,
        "Anthropic Analyst Chat"
      );
      answer = response.content.map((block) => ("text" in block ? block.text : "")).join("\n").trim();
    }

    if (!answer) {
      throw appError("AI_PROVIDER_ERROR", "AI Analyst Chat returned an empty answer.", {
        suggestedAction: "Try again with a more specific question."
      });
    }

    const session = database.appendChatExchange({
      projectId: validated.projectId,
      sessionId: validated.sessionId,
      title: validated.question,
      userContent: validated.question,
      assistantContent: answer
    });
    return {
      session,
      answer,
      provider: settings.aiProvider,
      model: settings.model || defaultModel(settings.aiProvider)
    };
  } catch (error) {
    logEvent("ai.chat_failed", { error: friendlyError(error) });
    throw appError("AI_PROVIDER_ERROR", "AI Analyst Chat could not answer right now.", {
      details: { cause: friendlyError(error) },
      suggestedAction: "Try again, check your API key/model, or use the rule-based Action Plan."
    });
  }
}

async function exportPdf(payload: PdfExportPayload): Promise<string | null> {
  const validated = validatePdfExportPayload(payload);
  const options: SaveDialogOptions = {
    title: "Export Executive Brief",
    defaultPath: `${validated.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "growthlens-campaign-brief"}.pdf`,
    filters: [{ name: "PDF", extensions: ["pdf"] }]
  };
  const result = mainWindow ? await dialog.showSaveDialog(mainWindow, options) : await dialog.showSaveDialog(options);
  if (result.canceled || !result.filePath) return null;

  const reportWindow = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  try {
    const html = buildReportHtml({
      title: validated.title,
      dateRange: validated.dateRange,
      generatedAt: new Date().toLocaleDateString(),
      analysis: validated.analysis,
      aiInsights: validated.aiInsights,
      branding: validated.branding
    });
    await reportWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const pdf = await reportWindow.webContents.printToPDF({ printBackground: true, pageSize: "A4" });
    fs.writeFileSync(result.filePath, pdf);
    logEvent("pdf.exported", { bytes: pdf.byteLength });
    return result.filePath;
  } catch (error) {
    throw appError("PDF_EXPORT_FAILED", "The Executive Brief could not be exported.", {
      details: { cause: friendlyError(error) },
      suggestedAction: "Try exporting again, or save to a different folder."
    });
  } finally {
    reportWindow.destroy();
  }
}

function diagnostics() {
  const settings = getSettingsWithKey();
  return {
    appVersion: app.getVersion(),
    releaseLabel: "Version 1",
    dataDirectory: app.getPath("userData"),
    logFile: logPath,
    secureStorageAvailable: safeStorage.isEncryptionAvailable(),
    aiConfigured: settings.aiProvider === "ollama" || Boolean(settings.aiProvider !== "disabled" && settings.apiKey)
  };
}

function handle<T>(channel: string, handler: (...args: unknown[]) => Promise<T> | T): void {
  ipcMain.handle(channel, async (_event, ...args): Promise<IpcResult<T>> => {
    const operationId = createOperationId(channel.replace(/[^a-z0-9]+/gi, "_"));
    try {
      const data = await handler(...args);
      return { ok: true, data };
    } catch (error) {
      const payload = toAppErrorPayload(error, operationId);
      logEvent("ipc.error", { channel, code: payload.code, message: payload.message, operationId });
      return { ok: false, error: payload };
    }
  });
}

function registerIpc(): void {
  handle("campaign:pickFile", () => pickCampaignFile());
  handle("campaign:parseFile", (filePath) => parseCampaignFileFromPath(String(filePath ?? "")));
  handle("campaign:listProjects", () => database.listProjects());
  handle("campaign:loadProject", (id) => database.loadProject(assertProjectId(id)));
  handle("campaign:deleteProject", (id) => database.deleteProject(assertProjectId(id)));
  handle("campaign:saveProject", (payload) => database.saveProject(validateProjectPayload(payload)));
  handle("campaign:generateAiInsights", (payload) => generateAiInsights(payload as AIInsightPayload));
  handle("campaign:generateAiInsightsV1", (payload) => generateAiInsights(payload as AIInsightPayload));
  handle("campaign:chat", (payload) => sendAiChatMessage(payload as AIChatRequest));
  handle("campaign:listChatSessions", (projectId) => database.listChatSessions(projectId ? assertProjectId(projectId) : null));
  handle("campaign:clearChatSession", (sessionId) => database.clearChatSession(assertProjectId(sessionId)));
  handle("campaign:exportPdf", (payload) => exportPdf(payload as PdfExportPayload));
  handle("campaign:getSettings", () => getSettingsForRenderer());
  handle("campaign:saveSettings", (settings) => {
    const validated = validateSettings(settings, safeStorage.isEncryptionAvailable());
    const existing = database.getEncryptedApiKey();
    const encrypted = validated.apiKey ? encryptApiKey(validated.apiKey) : existing;
    const saved = database.saveSettings({ ...validated, apiKey: undefined }, encrypted);
    return { ...saved, apiKey: undefined, hasStoredApiKey: Boolean(encrypted) };
  });
  handle("campaign:testAiConnection", async (settings) => {
    const validated = validateSettings(settings, safeStorage.isEncryptionAvailable());
    const apiKey = validated.apiKey ?? getSettingsWithKey().apiKey;
    if (validated.aiProvider === "disabled") return { ok: true, message: "AI is disabled. Rule-based Decision Panel output is available." };
    if (providerRequiresApiKey(validated.aiProvider) && !apiKey) return { ok: false, message: "Add an API key before testing the AI connection." };
    try {
      if (validated.aiProvider === "openai") {
        const client = new OpenAI({ apiKey });
        await withTimeout(client.models.list(), 15_000, "OpenAI connection test");
      } else if (validated.aiProvider === "google") {
        await callGoogleText(validated, apiKey ?? "", "Return {\"ok\":true}", "Return JSON only.", true);
      } else if (validated.aiProvider === "ollama") {
        await callOllamaText(validated, [{ role: "user", content: "Reply with OK only." }], "Ollama connection test");
      } else {
        const client = new Anthropic({ apiKey });
        await withTimeout(
          client.messages.create({
            model: validated.model || "claude-3-5-haiku-latest",
            max_tokens: 16,
            messages: [{ role: "user", content: "Reply with JSON: {\"ok\":true}" }]
          }),
          15_000,
          "Anthropic connection test"
        );
      }
      return { ok: true, message: "AI connection works." };
    } catch {
      return { ok: false, message: "The AI provider rejected the connection. Check your key and model." };
    }
  });
  handle("campaign:diagnostics", () => diagnostics());
}

app.whenReady().then(() => {
  ensureRuntimeDirs();
  const dbPath = path.join(app.getPath("userData"), "growthlens-campaign.sqlite");
  database = new AppDatabase(dbPath);
  registerIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
