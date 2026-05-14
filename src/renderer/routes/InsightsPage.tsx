import { useNavigate } from "react-router-dom";
import { AIAnalystChat } from "../components/insights/AIAnalystChat";
import { AIInsightsPanel } from "../components/insights/AIInsightsPanel";
import { RecommendationCard } from "../components/insights/RecommendationCard";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { useCampaign } from "../state/CampaignContext";

export function InsightsPage() {
  const navigate = useNavigate();
  const { analysis, aiInsights, generateInsights, settings, loading, chatSessions, activeChatSessionId, sendChatMessage, clearChatSession, selectChatSession } = useCampaign();
  if (!analysis) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <CardTitle>No Decision Panel yet</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Analyze campaign data before generating the Action Plan.</p>
          </div>
          <Button onClick={() => navigate("/upload")}>Upload Campaign Data</Button>
        </CardContent>
      </Card>
    );
  }
  const chatDisabledReason =
    settings.aiProvider === "disabled"
      ? "AI Analyst Chat is disabled for privacy-first V1. Enable OpenAI or Anthropic in Settings to chat with this analysis."
      : !settings.hasStoredApiKey
        ? "Add an API key in Settings to use AI Analyst Chat. Deterministic Action Plan items remain available below."
        : undefined;
  const aiBusy = loading === "Generating AI insights";
  const chatBusy = loading === "Asking AI Analyst";
  return (
    <div className="grid gap-6">
      <AIInsightsPanel insights={aiInsights} onGenerate={() => void generateInsights()} busy={aiBusy} />
      {settings.aiProvider !== "disabled" && !settings.hasStoredApiKey ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Add an API key in Settings to call the selected AI provider. Rule-based Action Plan items remain available below.
        </div>
      ) : null}
      <AIAnalystChat
        sessions={chatSessions}
        activeSessionId={activeChatSessionId}
        disabledReason={chatDisabledReason}
        busy={chatBusy}
        onSend={sendChatMessage}
        onSelectSession={selectChatSession}
        onClearSession={clearChatSession}
      />
      <Card>
        <CardHeader>
          <CardTitle>Action Plan</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {analysis.recommendations.length ? (
            analysis.recommendations.map((recommendation) => <RecommendationCard key={`${recommendation.campaignName}-${recommendation.issue}-${recommendation.action}`} recommendation={recommendation} />)
          ) : (
            <div className="col-span-2 rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No major Action Plan issues were detected.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
