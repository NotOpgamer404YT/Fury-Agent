"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, PlugZap, X, KeyRound, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const PRESETS: Record<string, { label: string; baseUrl: string }> = {
  "openai-compatible": { label: "OpenAI-compatible", baseUrl: "https://api.openai.com/v1" },
  freellmapi: { label: "FreeLLMAPI", baseUrl: "https://api.freellmapi.com/v1" },
  omniroute: { label: "OmniRoute", baseUrl: "https://api.omniroute.ai/v1" },
  gemini: { label: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta" },
  groq: { label: "Groq", baseUrl: "https://api.groq.com/openai/v1" },
  cerebras: { label: "Cerebras", baseUrl: "https://api.cerebras.ai/v1" },
  openrouter: { label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1" },
  custom: { label: "Custom", baseUrl: "" },
};

const empty = {
  name: "", providerType: "openai-compatible", baseUrl: PRESETS["openai-compatible"].baseUrl, apiKey: "", modelId: "",
  contextWindow: 128000, maxOutputTokens: 4096, supportsTools: false, supportsStreaming: true,
  temperature: 0.2, timeoutMs: 60000, priority: 50, enabled: true, isDefault: false, isCoding: false, isPlanning: false, isReview: false,
};

async function get<T>(path: string): Promise<T> {
  const r = await fetch(path);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "Request failed");
  return j.data;
}

export function ProvidersView() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, string>>({});
  const [models, setModels] = useState<Record<string, string[]>>({});

  const providers = useQuery({ queryKey: ["providers"], queryFn: () => get<{ providers: any[]; encryptionConfigured: boolean }>("/api/v1/providers") });

  function openNew() { setEditing(null); setForm(empty); setError(""); setOpen(true); }
  function openEdit(p: any) {
    setEditing(p.id);
    setForm({ ...empty, ...p, apiKey: "", temperature: Number(p.temperature) });
    setError(""); setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const payload: any = { ...form, temperature: Number(form.temperature), contextWindow: Number(form.contextWindow), maxOutputTokens: Number(form.maxOutputTokens), timeoutMs: Number(form.timeoutMs), priority: Number(form.priority) };
    if (!payload.apiKey) delete payload.apiKey;
    const res = await fetch(editing ? `/api/v1/providers/${editing}` : "/api/v1/providers", {
      method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(j.error ?? "Save failed"); return; }
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["providers"] });
  }

  async function remove(id: string) {
    if (!confirm("Delete this provider configuration?")) return;
    await fetch(`/api/v1/providers/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["providers"] });
  }

  async function test(id: string) {
    setTestResult((r) => ({ ...r, [id]: "testing…" }));
    const res = await fetch(`/api/v1/providers/${id}/test`, { method: "POST" });
    const j = await res.json().catch(() => ({}));
    setTestResult((r) => ({ ...r, [id]: j.data?.ok ? `✓ ${j.data.message}${j.data.models?.length ? ` (${j.data.models.length} models)` : ""}` : `✗ ${j.data?.message ?? j.error ?? "failed"}` }));
    if (j.data?.models?.length) setModels((m) => ({ ...m, [id]: j.data.models }));
    qc.invalidateQueries({ queryKey: ["providers"] });
  }

  async function discover(id: string) {
    const res = await fetch(`/api/v1/models?providerId=${id}`);
    const j = await res.json().catch(() => ({}));
    const found = j.data?.models?.[0]?.models ?? [];
    setModels((m) => ({ ...m, [id]: found }));
    if (!found.length) setTestResult((r) => ({ ...r, [id]: "✗ Model discovery unsupported or returned nothing — enter the model ID manually." }));
  }

  return (
    <div className="space-y-4 p-4 md:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Bring your own API keys. Keys are encrypted with AES-256-GCM and never returned by the API.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Add provider</Button>
      </div>

      {providers.data && !providers.data.encryptionConfigured && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>ENCRYPTION_KEY is not configured on the server. Set it in your environment before saving API keys.</span>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {(providers.data?.providers ?? []).map((p) => (
          <Card key={p.id}>
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">{p.name} <Badge status={p.enabled ? "enabled" : "disabled"} /></CardTitle>
                <p className="mt-0.5 font-mono text-xs text-muted">{p.providerType} · {p.modelId}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(p)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(p.id)} aria-label="Delete"><Trash2 className="h-4 w-4 text-red-400" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs text-muted">
                <span>Tools: {p.supportsTools ? "yes" : "no"}</span>
                <span>Streaming: {p.supportsStreaming ? "yes" : "no"}</span>
                <span>Context: {p.contextWindow.toLocaleString()}</span>
                <span>Max out: {p.maxOutputTokens}</span>
                <span>Key: {p.hasApiKey ? "stored ✓" : "none"}</span>
                <span>Priority: {p.priority}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {p.isDefault && <span className="rounded bg-accent/20 px-2 py-0.5 text-[10px] text-accent">default</span>}
                {p.isCoding && <span className="rounded bg-fuchsia-500/20 px-2 py-0.5 text-[10px] text-fuchsia-300">coding</span>}
                {p.isPlanning && <span className="rounded bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-300">planning</span>}
                {p.isReview && <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300">review</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => test(p.id)}><PlugZap className="h-4 w-4" /> Test</Button>
                <Button size="sm" variant="ghost" onClick={() => discover(p.id)}>Fetch models</Button>
              </div>
              {testResult[p.id] && <p className="text-xs text-muted">{testResult[p.id]}</p>}
              {models[p.id]?.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-lg border border-border bg-panel p-2">
                  {models[p.id].map((m) => <p key={m} className="truncate font-mono text-[11px] text-muted">{m}</p>)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {providers.data?.providers.length === 0 && (
        <Card><CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <KeyRound className="h-8 w-8 text-accent" />
          <p className="font-medium">No providers configured</p>
          <p className="max-w-md text-sm text-muted">Add your own Gemini, Groq, Cerebras, OpenRouter, FreeLLMAPI, OmniRoute or any OpenAI-compatible endpoint. Free tiers are not guaranteed — check each provider&apos;s current limits.</p>
          <Button onClick={openNew}><Plus className="h-4 w-4" /> Add your first provider</Button>
        </CardContent></Card>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-card p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit provider" : "Add provider"}</h2>
              <Button size="icon" variant="ghost" onClick={() => setOpen(false)}><X className="h-5 w-5" /></Button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1"><Label>Provider name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Groq · Llama 3.3" /></div>
                <div className="space-y-1"><Label>Type</Label>
                  <Select value={form.providerType} onChange={(e) => setForm({ ...form, providerType: e.target.value, baseUrl: PRESETS[e.target.value]?.baseUrl ?? form.baseUrl })}>
                    {Object.entries(PRESETS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </Select></div>
              </div>
              <div className="space-y-1"><Label>API base URL</Label><Input required value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://api.groq.com/openai/v1" /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1"><Label>API key {editing && "(leave blank to keep)"}</Label>
                  <Input type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder="your-own-key" autoComplete="off" /></div>
                <div className="space-y-1"><Label>Model ID</Label><Input required value={form.modelId} onChange={(e) => setForm({ ...form, modelId: e.target.value })} placeholder="llama-3.3-70b-versatile" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-1"><Label>Context window</Label><Input type="number" value={form.contextWindow} onChange={(e) => setForm({ ...form, contextWindow: e.target.value })} /></div>
                <div className="space-y-1"><Label>Max output</Label><Input type="number" value={form.maxOutputTokens} onChange={(e) => setForm({ ...form, maxOutputTokens: e.target.value })} /></div>
                <div className="space-y-1"><Label>Temperature</Label><Input type="number" step="0.1" min="0" max="2" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} /></div>
                <div className="space-y-1"><Label>Timeout (ms)</Label><Input type="number" value={form.timeoutMs} onChange={(e) => setForm({ ...form, timeoutMs: e.target.value })} /></div>
              </div>
              <div className="space-y-1"><Label>Priority (lower runs first)</Label><Input type="number" min="0" max="100" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-panel p-3 text-sm">
                {[["supportsTools", "Tool calling"], ["supportsStreaming", "Streaming"], ["enabled", "Enabled"], ["isDefault", "Default model"], ["isCoding", "Coding model"], ["isPlanning", "Planning model"], ["isReview", "Review model"]].map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2">
                    <input type="checkbox" checked={Boolean(form[k])} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} className="h-4 w-4 accent-[#8B5CF6]" />
                    <span className="text-xs text-muted">{label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted">Only enable tool calling if your provider/model supports OpenAI-style <code className="font-mono">tool_calls</code>. Free model availability is never guaranteed.</p>
              {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={busy} className="flex-1">{busy ? "Saving…" : editing ? "Save changes" : "Add provider"}</Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Textarea className="hidden" aria-hidden />
    </div>
  );
}
