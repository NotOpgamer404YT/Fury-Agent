"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Play, Pause, RotateCcw, CheckCircle2, XCircle as RejectIcon, Terminal, Cpu, Clock, ShieldCheck, ChevronDown, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TERMINAL = ["completed", "failed", "cancelled"];

export function TaskDetail({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [showEvents, setShowEvents] = useState(true);
  const [followUp, setFollowUp] = useState("");
  const [sending, setSending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/v1/tasks/${taskId}`);
    const j = await res.json().catch(() => ({}));
    if (res.ok) { setTask(j.data.task); setMessages(j.data.messages ?? []); }
    const ev = await fetch(`/api/v1/tasks/${taskId}/events`);
    const ej = await ev.json().catch(() => ({}));
    if (ev.ok) setEvents(ej.data.events ?? []);
  }, [taskId]);

  useEffect(() => { load(); }, [load]);

  const step = useCallback(async () => {
    setRunning(true); setError("");
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/step`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j.error ?? "Step failed"); setRunning(false); return; }
      await load();
      const status = j.data.status;
      if (TERMINAL.includes(status) || status === "waiting_approval") { setRunning(false); return; }
      // Continue stepping while on the page
      setTimeout(() => { step(); }, 600);
    } catch (e: any) {
      setError(e?.message ?? "Step failed");
      setRunning(false);
    }
  }, [taskId, load]);

  async function approve(approved: boolean) {
    setRunning(true);
    await fetch(`/api/v1/tasks/${taskId}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approved }) });
    await load();
    setRunning(false);
    if (approved) step();
  }

  async function cancel() {
    await fetch(`/api/v1/tasks/${taskId}/cancel`, { method: "POST" });
    setRunning(false);
    await load();
  }

  async function sendFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!followUp.trim()) return;
    setSending(true);
    const res = await fetch(`/api/v1/tasks/${taskId}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: followUp }),
    });
    setSending(false);
    if (!res.ok) { setError("Could not send follow-up"); return; }
    setFollowUp("");
    await load();
    step();
  }

  async function resume() {
    setRunning(true);
    await fetch(`/api/v1/tasks/${taskId}/resume`, { method: "POST" });
    await load();
    step();
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  if (!task) return <div className="p-6 text-sm text-muted">Loading task…</div>;

  const pending = task.state?.pendingTool;
  const toolEvents = events.filter((e) => e.type.startsWith("tool"));

  return (
    <div className="space-y-4 p-4 pb-28 md:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{task.title}</CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge status={task.mode} /><Badge status={task.status} />
              <span className="flex items-center gap-1 text-xs text-muted"><Cpu className="h-3 w-3" /> step {task.stepCount}/{task.maxSteps}</span>
              {task.modelId && <span className="font-mono text-xs text-muted">{task.modelId}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!TERMINAL.includes(task.status) && task.status !== "waiting_approval" && (
              <Button size="sm" onClick={step} disabled={running}><Play className="h-4 w-4" /> {running ? "Running…" : "Run step"}</Button>
            )}
            {task.status === "waiting_approval" && (
              <>
                <Button size="sm" onClick={() => approve(true)}><CheckCircle2 className="h-4 w-4" /> Approve</Button>
                <Button size="sm" variant="outline" onClick={() => approve(false)}><RejectIcon className="h-4 w-4" /> Reject</Button>
              </>
            )}
            {!TERMINAL.includes(task.status) && <Button size="sm" variant="outline" onClick={cancel}><Pause className="h-4 w-4" /> Cancel</Button>}
            {["failed", "cancelled"].includes(task.status) && <Button size="sm" variant="secondary" onClick={resume}><RotateCcw className="h-4 w-4" /> Resume</Button>}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">{task.prompt}</p>
          {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
          {task.lastError && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">Last error: {task.lastError}</p>}
          {pending && (
            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="flex items-center gap-2 text-sm text-amber-200"><ShieldCheck className="h-4 w-4" /> Approval required: <span className="font-mono">{pending.name}</span></p>
              <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-black/30 p-2 text-[11px] text-amber-100/80">{JSON.stringify(pending.args, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Conversation</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {messages.length === 0 && <p className="text-sm text-muted">No messages yet. Run a step to start the agent.</p>}
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "rounded-xl bg-accent/10 p-3" : m.role === "tool" ? "rounded-xl border border-border bg-panel p-3" : "rounded-xl bg-card p-3"}>
                <p className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted">
                  {m.role}{m.toolName ? ` · ${m.toolName}` : ""}
                </p>
                {m.role === "tool" ? (
                  <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words text-[11px] text-muted">{m.content}</pre>
                ) : (
                  <div className="prose-fury max-w-none text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Progress</CardTitle>
              <button onClick={() => setShowEvents((s) => !s)} aria-label="Toggle"><ChevronDown className={`h-4 w-4 text-muted transition ${showEvents ? "" : "-rotate-90"}`} /></button>
            </CardHeader>
            {showEvents && (
              <CardContent className="max-h-72 space-y-2 overflow-y-auto">
                {events.length === 0 && <p className="text-xs text-muted">No events yet.</p>}
                {events.map((e) => (
                  <div key={e.id} className="flex gap-2 text-xs">
                    <Clock className="mt-0.5 h-3 w-3 shrink-0 text-muted" />
                    <div><p className={e.type.includes("error") || e.type === "failed" ? "text-red-300" : "text-primary"}>{e.message}</p>
                      <p className="text-[10px] text-muted">{new Date(e.createdAt).toLocaleTimeString()}</p></div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Terminal className="h-4 w-4" /> Tool activity</CardTitle></CardHeader>
            <CardContent className="max-h-56 space-y-1 overflow-y-auto">
              {toolEvents.length === 0 && <p className="text-xs text-muted">No tool calls yet.</p>}
              {toolEvents.map((e) => <p key={e.id} className="font-mono text-[11px] text-muted">{e.message}</p>)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
