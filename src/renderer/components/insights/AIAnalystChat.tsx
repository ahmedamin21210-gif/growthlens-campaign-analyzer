import { useMemo, useState } from "react";
import type { AIChatSession } from "@shared/types";
import { Bot, MessageSquare, Send, Trash2 } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

const starterPrompts = [
  "What should I do first?",
  "Which campaigns are leaking budget?",
  "Where should I move budget?",
  "Explain this like I'm sending it to a client.",
  "What are the biggest risks in this account?"
];

export function AIAnalystChat({
  sessions,
  activeSessionId,
  disabledReason,
  busy,
  onSend,
  onSelectSession,
  onClearSession
}: {
  sessions: AIChatSession[];
  activeSessionId: string | null;
  disabledReason?: string;
  busy?: boolean;
  onSend: (question: string) => Promise<boolean>;
  onSelectSession: (sessionId: string | null) => void;
  onClearSession: (sessionId: string) => Promise<void>;
}) {
  const [question, setQuestion] = useState("");
  const activeSession = useMemo(() => sessions.find((session) => session.id === activeSessionId) ?? sessions[0] ?? null, [activeSessionId, sessions]);
  const disabled = Boolean(disabledReason || busy);

  async function submit(nextQuestion = question) {
    const trimmed = nextQuestion.trim();
    if (!trimmed || disabled) return;
    const ok = await onSend(trimmed);
    if (ok) setQuestion("");
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bot size={18} />
            AI Analyst Chat
          </CardTitle>
          <p className="mt-1 text-sm text-slate-500">Ask questions about the current workspace analysis, Decision Panel, Action Plan, and campaign summaries.</p>
        </div>
        <Badge tone={disabledReason ? "amber" : "blue"}>{disabledReason ? "AI unavailable" : "Context aware"}</Badge>
      </CardHeader>
      <CardContent className="grid gap-4">
        {disabledReason ? (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">{disabledReason}</div>
        ) : null}

        {sessions.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {sessions.slice(0, 6).map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => onSelectSession(session.id)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  session.id === activeSession?.id ? "border-brand-cyan bg-cyan-50 text-brand-navy" : "border-brand-border bg-white text-slate-600"
                }`}
              >
                {session.title}
              </button>
            ))}
          </div>
        ) : null}

        <div className="min-h-[220px] rounded-2xl border border-brand-border bg-slate-50 p-4">
          {activeSession?.messages.length ? (
            <div className="grid gap-3">
              {activeSession.messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user" ? "bg-brand-navy text-white" : "border border-brand-border bg-white text-slate-700"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-[190px] flex-col items-center justify-center text-center text-sm text-slate-500">
              <MessageSquare className="mb-3 text-brand-cyan" size={30} />
              <p className="font-semibold text-brand-navy">Start with a focused campaign question.</p>
              <p className="mt-1 max-w-lg">Chat uses the completed analysis context only. It will not change campaign data or invent missing metrics.</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {starterPrompts.map((prompt) => (
            <Button key={prompt} type="button" variant="secondary" size="sm" disabled={disabled} onClick={() => void submit(prompt)}>
              {prompt}
            </Button>
          ))}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <label className="sr-only" htmlFor="ai-chat-question">
            Ask AI Analyst
          </label>
          <textarea
            id="ai-chat-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={disabled}
            rows={2}
            maxLength={4000}
            placeholder="Ask about budget movement, risks, client explanation, or next actions..."
            className="min-h-11 flex-1 resize-none rounded-xl border border-brand-border bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-cyan focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          <Button type="submit" disabled={disabled || !question.trim()}>
            <Send size={16} />
            {busy ? "Asking" : "Send"}
          </Button>
          {activeSession ? (
            <Button type="button" variant="ghost" size="icon" disabled={busy} onClick={() => void onClearSession(activeSession.id)} aria-label="Clear AI chat">
              <Trash2 size={16} />
            </Button>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
