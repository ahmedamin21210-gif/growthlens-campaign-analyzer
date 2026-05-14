import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Field, Input, Select, Textarea } from "../components/ui/Form";
import { useCampaign } from "../state/CampaignContext";

export function SettingsPage() {
  const { settings, saveSettings, testAiConnection, diagnostics } = useCampaign();
  const [draft, setDraft] = useState(settings);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<Awaited<ReturnType<typeof diagnostics>>>(null);

  function setTarget(key: keyof typeof draft.targets, value: string) {
    setDraft((current) => ({
      ...current,
      targets: {
        ...current.targets,
        [key]: value === "" ? null : Number(value)
      }
    }));
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>AI settings</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Decision Panel summaries are sent to the selected provider only after deterministic calculations complete.</p>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <Field label="Provider">
            <Select value={draft.aiProvider} onChange={(event) => setDraft((current) => ({ ...current, aiProvider: event.target.value as typeof draft.aiProvider }))}>
              <option value="disabled">Disabled</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic Claude</option>
            </Select>
          </Field>
          <Field label="Model">
            <Input value={draft.model} onChange={(event) => setDraft((current) => ({ ...current, model: event.target.value }))} />
          </Field>
          <Field label="API key">
            <Input
              type="password"
              placeholder={settings.hasStoredApiKey ? "Saved key is stored securely" : "Paste API key"}
              value={draft.apiKey ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, apiKey: event.target.value }))}
            />
          </Field>
          <label className="col-span-3 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={draft.allowDetailedAiData}
              onChange={(event) => setDraft((current) => ({ ...current, allowDetailedAiData: event.target.checked }))}
            />
            Allow detailed campaign rows to be sent to AI providers in future advanced mode
          </label>
          <div className="col-span-3 flex items-center gap-3">
            <Button onClick={() => void saveSettings(draft)}>Save settings</Button>
            <Button
              variant="secondary"
              onClick={async () => {
                const result = await testAiConnection(draft);
                setTestResult(result.message);
              }}
            >
              Test API connection
            </Button>
            {testResult ? <span className="text-sm text-slate-600">{testResult}</span> : null}
          </div>
          <p className="col-span-3 rounded-xl border border-brand-border bg-slate-50 p-3 text-sm leading-6 text-slate-600">
            AI is optional. When enabled, GrowthLens sends summarized KPI metrics and detected issues only, not raw unnecessary campaign rows.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Marketing targets</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <Field label="Target ROAS">
            <Input type="number" step="0.1" value={draft.targets.targetRoas} onChange={(event) => setTarget("targetRoas", event.target.value)} />
          </Field>
          <Field label="Target CPA">
            <Input type="number" step="0.01" value={draft.targets.targetCpa ?? ""} onChange={(event) => setTarget("targetCpa", event.target.value)} />
          </Field>
          <Field label="Maximum CPC">
            <Input type="number" step="0.01" value={draft.targets.maximumCpc ?? ""} onChange={(event) => setTarget("maximumCpc", event.target.value)} />
          </Field>
          <Field label="Minimum CTR">
            <Input type="number" step="0.001" value={draft.targets.minimumCtr} onChange={(event) => setTarget("minimumCtr", event.target.value)} />
          </Field>
          <Field label="Minimum conversion rate">
            <Input type="number" step="0.001" value={draft.targets.minimumConversionRate} onChange={(event) => setTarget("minimumConversionRate", event.target.value)} />
          </Field>
          <Field label="Profit margin">
            <Input type="number" step="0.01" value={draft.targets.profitMargin ?? ""} onChange={(event) => setTarget("profitMargin", event.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding and data defaults</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <Field label="Company name">
            <Input value={draft.branding.companyName} onChange={(event) => setDraft((current) => ({ ...current, branding: { ...current.branding, companyName: event.target.value } }))} />
          </Field>
          <Field label="Analyst name">
            <Input value={draft.branding.analystName} onChange={(event) => setDraft((current) => ({ ...current, branding: { ...current.branding, analystName: event.target.value } }))} />
          </Field>
          <Field label="Client name">
            <Input value={draft.branding.clientName} onChange={(event) => setDraft((current) => ({ ...current, branding: { ...current.branding, clientName: event.target.value } }))} />
          </Field>
          <Field label="Primary color">
            <Input type="color" value={draft.branding.primaryColor} onChange={(event) => setDraft((current) => ({ ...current, branding: { ...current.branding, primaryColor: event.target.value } }))} />
          </Field>
          <Field label="Currency">
            <Input value={draft.defaultCurrency} onChange={(event) => setDraft((current) => ({ ...current, defaultCurrency: event.target.value.toUpperCase() }))} />
          </Field>
          <Field label="Date format">
            <Input value={draft.dateFormat} onChange={(event) => setDraft((current) => ({ ...current, dateFormat: event.target.value }))} />
          </Field>
          <div className="col-span-3">
            <Field label="Executive Brief footer">
              <Textarea value={draft.branding.reportFooter} onChange={(event) => setDraft((current) => ({ ...current, branding: { ...current.branding, reportFooter: event.target.value } }))} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diagnostics and privacy</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Local data paths and runtime safety information for support and troubleshooting.</p>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-slate-700">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={async () => {
                setDiagnosticInfo(await diagnostics());
              }}
            >
              Load diagnostics
            </Button>
          </div>
          {diagnosticInfo ? (
            <div className="grid gap-2 rounded-xl border border-brand-border bg-slate-50 p-4">
              <div><strong>App version:</strong> {diagnosticInfo.appVersion}</div>
              <div><strong>Release:</strong> {diagnosticInfo.releaseLabel}</div>
              <div><strong>Data directory:</strong> {diagnosticInfo.dataDirectory}</div>
              <div><strong>Log file:</strong> {diagnosticInfo.logFile}</div>
              <div><strong>Secure key storage:</strong> {diagnosticInfo.secureStorageAvailable ? "Available" : "Unavailable"}</div>
              <div><strong>AI configured:</strong> {diagnosticInfo.aiConfigured ? "Yes" : "No"}</div>
            </div>
          ) : null}
          <p className="rounded-xl border border-cyan-100 bg-cyan-50 p-3 text-sm leading-6 text-cyan-900">
            GrowthLens Campaign Analyzer stores workspaces locally. No cloud account is required, and AI calls happen only when you enable a provider and generate the Decision Panel or AI Analyst Chat.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
