"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Plus, X, Sparkles, ClipboardList, Code2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "next/navigation";

async function get<T>(path: string): Promise<T> {
  const r = await fetch(path);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "Request failed");
  return j.data;
}

const MODES = [
  { id: "ask", label: "Ask", icon: Sparkles, desc: "Explain code and answer questions. Read-only." },
  { id: "plan", label: "Plan", icon: ClipboardList, desc: "Analyze and produce an implementation plan. Read-only." },
  { id: "agent", label: "Agent", icon: Code2, desc: "Edit files, commit and open PRs with approvals." },
];

export function TasksView({ userName }: { userName: string }) {
  const qc = useQueryClient();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", prompt: "", mode: "ask", projectId: params.get("projectId") ?? "", providerId: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => get<{ tasks: any[] }>("/api/v1/tasks") });
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => get<{ projects: any[] }>("/api/v1/projects") });
  const providers = useQuery({ queryKey: ["providers"], queryFn: () => get<{ providers: any[] }>("/api/v1/providers") });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const payload: any = { title: form.title, prompt: form.prompt, mode: form.mode };
    if (form.projectId) payload.projectId = form.projectId;
    if (form.providerId) payload.providerId = form.providerId;
    const res = await fetch("/api/v1/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(j.error ?? "Could not create task"); return; }
    qc.invalidateQueries({ queryKey: ["tasks"] });
    window.location.href = `/tasks/${j.data.task.id}`;
  }

  return (
    <div className="space-y-4 p-4 md:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Hi {userName || "there"} — every task runs bounded agent steps with persisted checkpoints.</p>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New task</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {MODES.map((m) => (
          <Card key={m.id} className="cursor-pointer hover:border-accent/40" onClick={() => { setForm({ ...form, mode: m.id }); setOpen(true); }}>
            <CardContent className="p-4">
              <m.icon className="mb-2 h-4 w-4 text-accent2" />
              <p className="text-sm font-medium">{m.label} mode</p>
              <p className="text-xs text-muted">{m.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        {(tasks.data?.tasks ?? []).map((t) => (
          <Link key={t.id} href={`/tasks/${t.id}`}>
            <Card className="transition hover:border-accent/40">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="truncate text-xs text-muted">{t.prompt.slice(0, 110)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2"><Badge status={t.mode} /><Badge status={t.status} /></div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {tasks.data?.tasks.length === 0 && (
          <Card><CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Bot className="h-8 w-8 text-accent" />
            <p className="font-medium">No agent tasks yet</p>
            <p className="max-w-md text-sm text-muted">Create a task to ask about a repository, generate a plan, or let the agent implement a change end to end.</p>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New task</Button>
          </CardContent></Card>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-xl rounded-t-2xl border border-border bg-card p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">New agent task</h2>
              <Button size="icon" variant="ghost" onClick={() => setOpen(false)}><X className="h-5 w-5" /></Button></div>
            <form onSubmit={create} className="space-y-3">
              <div className="space-y-1"><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Add rate limiting to the auth routes" /></div>
              <div className="space-y-1"><Label>What should Fury do?</Label>
                <Textarea required rows={5} value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} placeholder="Describe the task. Reference files or features if you know them." /></div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1"><Label>Mode</Label>
                  <Select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                    {MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </Select></div>
                <div className="space-y-1"><Label>Project</Label>
                  <Select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                    <option value="">None</option>
                    {(projects.data?.projects ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select></div>
                <div className="space-y-1"><Label>Provider</Label>
                  <Select value={form.providerId} onChange={(e) => setForm({ ...form, providerId: e.target.value })}>
                    <option value="">Auto (priority)</option>
                    {(providers.data?.providers ?? []).filter((p) => p.enabled).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select></div>
              </div>
              {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
              <div className="flex gap-2"><Button type="submit" className="flex-1" disabled={busy}>{busy ? "Creating…" : "Create task"}</Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
