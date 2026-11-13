/**
 * Provider adapters. All presets except Gemini are OpenAI-compatible
 * (chat/completions + models). Gemini uses its native generateContent API.
 * Adapters never assume tool-calling/streaming/model-discovery support —
 * callers must check supportsTools / supportsStreaming flags.
 */
import { decrypt } from "@/lib/encryption";

export type ProviderConfig = {
  id: string; userId: string; name: string; providerType: string; baseUrl: string;
  apiKeyEncrypted: string | null; modelId: string; contextWindow: number; maxOutputTokens: number;
  supportsTools: boolean; supportsStreaming: boolean; temperature: string; timeoutMs: number;
  priority: number; enabled: boolean; isDefault: boolean; isCoding: boolean; isPlanning: boolean; isReview: boolean;
  lastTestedAt?: Date | null; lastTestStatus?: string | null;
};

export const PROVIDER_PRESETS: Record<string, { label: string; baseUrl: string; note: string }> = {
  "openai-compatible": { label: "OpenAI-compatible", baseUrl: "https://api.openai.com/v1", note: "Any OpenAI-compatible endpoint" },
  freellmapi: { label: "FreeLLMAPI", baseUrl: "https://api.freellmapi.com/v1", note: "FreeLLMAPI OpenAI-compatible endpoint" },
  omniroute: { label: "OmniRoute", baseUrl: "https://api.omniroute.ai/v1", note: "OmniRoute OpenAI-compatible endpoint" },
  gemini: { label: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta", note: "Google AI Studio / Gemini API" },
  groq: { label: "Groq", baseUrl: "https://api.groq.com/openai/v1", note: "Groq OpenAI-compatible endpoint" },
  cerebras: { label: "Cerebras", baseUrl: "https://api.cerebras.ai/v1", note: "Cerebras OpenAI-compatible endpoint" },
  openrouter: { label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", note: "OpenRouter OpenAI-compatible endpoint" },
  custom: { label: "Custom endpoint", baseUrl: "", note: "Your own OpenAI-compatible endpoint" },
};

export function getApiKey(p: ProviderConfig): string {
  if (!p.apiKeyEncrypted) return "";
  try { return decrypt(p.apiKeyEncrypted); } catch { return ""; }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (e: any) {
    if (e?.name === "AbortError") throw new Error(`Provider request timed out after ${timeoutMs}ms`);
    throw new Error(`Could not reach the provider endpoint (${new URL(url).host}). Check the base URL and your network.`);
  } finally { clearTimeout(t); }
}

export type ChatMessage = { role: string; content: string };
export type ChatResult = { content: string; promptTokens: number; completionTokens: number; toolCalls?: Array<{ id: string; name: string; args: Record<string, unknown> }> };

/** Test connection: list models if supported, else minimal completion. */
export async function testProvider(p: ProviderConfig): Promise<{ ok: boolean; message: string; models?: string[] }> {
  const key = getApiKey(p);
  try {
    if (p.providerType === "gemini") {
      const res = await fetchWithTimeout(`${p.baseUrl}/models?key=${encodeURIComponent(key)}`, {}, p.timeoutMs);
      if (!res.ok) return { ok: false, message: `Gemini returned HTTP ${res.status}` };
      const j = await res.json().catch(() => ({}));
      const models = (j.models ?? []).map((m: any) => m.name?.replace("models/", "")).filter(Boolean).slice(0, 50);
      return { ok: true, message: "Connection successful", models };
    }
    const res = await fetchWithTimeout(`${p.baseUrl.replace(/\/$/, "")}/models`, {
      headers: { Authorization: `Bearer ${key}` },
    }, p.timeoutMs);
    if (!res.ok) return { ok: false, message: `Provider returned HTTP ${res.status}` };
    const j = await res.json().catch(() => ({}));
    const models = (j.data ?? []).map((m: any) => m.id).filter(Boolean).slice(0, 50);
    return { ok: true, message: "Connection successful", models };
  } catch (e: any) {
    return { ok: false, message: e?.name === "AbortError" ? "Request timed out" : (e?.message ?? "Connection failed") };
  }
}

export async function fetchModels(p: ProviderConfig): Promise<string[]> {
  const r = await testProvider(p);
  return r.models ?? [];
}

/** Non-streaming chat completion with optional tool definitions (OpenAI-compatible). */
export async function chatCompletion(p: ProviderConfig, messages: ChatMessage[], opts?: { tools?: any[]; model?: string }): Promise<ChatResult> {
  const key = getApiKey(p);
  const model = opts?.model ?? p.modelId;
  if (p.providerType === "gemini") {
    const sys = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n");
    const contents = messages.filter((m) => m.role !== "system").map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const res = await fetchWithTimeout(`${p.baseUrl}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemInstruction: sys ? { parts: [{ text: sys }] } : undefined, contents, generationConfig: { temperature: Number(p.temperature), maxOutputTokens: p.maxOutputTokens } }),
    }, p.timeoutMs);
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const j = await res.json();
    const content = j.candidates?.[0]?.content?.parts?.map((x: any) => x.text ?? "").join("") ?? "";
    return { content, promptTokens: j.usageMetadata?.promptTokenCount ?? 0, completionTokens: j.usageMetadata?.candidatesTokenCount ?? 0 };
  }
  const body: Record<string, unknown> = { model, messages, temperature: Number(p.temperature), max_tokens: p.maxOutputTokens };
  if (opts?.tools?.length && p.supportsTools) body.tools = opts.tools;
  const res = await fetchWithTimeout(`${p.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  }, p.timeoutMs);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Provider HTTP ${res.status}: ${t.slice(0, 300)}`);
  }
  const j = await res.json();
  const msg = j.choices?.[0]?.message ?? {};
  const toolCalls = (msg.tool_calls ?? []).map((tc: any) => ({
    id: tc.id ?? "",
    name: tc.function?.name ?? "",
    args: safeJson(tc.function?.arguments ?? "{}"),
  }));
  return {
    content: msg.content ?? "",
    promptTokens: j.usage?.prompt_tokens ?? 0,
    completionTokens: j.usage?.completion_tokens ?? 0,
    toolCalls: toolCalls.length ? toolCalls : undefined,
  };
}

function safeJson(s: string): Record<string, unknown> {
  try { return JSON.parse(s); } catch { return {}; }
}

/** Streaming chat (SSE passthrough for OpenAI-compatible; falls back to non-streaming). */
export async function streamChat(p: ProviderConfig, messages: ChatMessage[], onToken: (t: string) => void): Promise<ChatResult> {
  if (!p.supportsStreaming || p.providerType === "gemini") {
    const r = await chatCompletion(p, messages);
    onToken(r.content);
    return r;
  }
  const key = getApiKey(p);
  const res = await fetchWithTimeout(`${p.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: p.modelId, messages, temperature: Number(p.temperature), max_tokens: p.maxOutputTokens, stream: true }),
  }, p.timeoutMs);
  if (!res.ok || !res.body) {
    const r = await chatCompletion(p, messages);
    onToken(r.content);
    return r;
  }
  let content = "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let promptTokens = 0, completionTokens = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      const t = line.trim().replace(/^data:\s*/, "");
      if (!t || t === "[DONE]") continue;
      try {
        const j = JSON.parse(t);
        const delta = j.choices?.[0]?.delta?.content ?? "";
        if (delta) { content += delta; onToken(delta); }
        if (j.usage) { promptTokens = j.usage.prompt_tokens ?? promptTokens; completionTokens = j.usage.completion_tokens ?? completionTokens; }
      } catch { /* ignore partial lines */ }
    }
  }
  return { content, promptTokens, completionTokens };
}

/** Pick provider for a role with priority fallback. */
export function pickProvider(providers: ProviderConfig[], role: "default" | "coding" | "planning" | "review", explicitId?: string): ProviderConfig | null {
  const enabled = providers.filter((p) => p.enabled);
  if (explicitId) {
    const ex = enabled.find((p) => p.id === explicitId);
    if (ex) return ex;
  }
  const flag = role === "coding" ? "isCoding" : role === "planning" ? "isPlanning" : role === "review" ? "isReview" : "isDefault";
  const flagged = enabled.filter((p) => (p as any)[flag]).sort((a, b) => a.priority - b.priority);
  if (flagged.length) return flagged[0];
  return [...enabled].sort((a, b) => a.priority - b.priority)[0] ?? null;
}
