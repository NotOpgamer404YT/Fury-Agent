/**
 * Streaming reply path for ASK / PLAN tasks.
 *
 * AGENT mode must go through the bounded step endpoint because tool calls need
 * permission checks and approval gates. Conversational replies can stream tokens
 * directly; the final message, usage and events are persisted before the stream
 * closes so a dropped connection never loses history silently.
 */
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import { store } from "@/lib/store";
import { pickProvider, streamChat, type ProviderConfig } from "@/server/providers";
import { buildMemoryContext, compressHistory } from "@/server/memory";
import { isTerminal } from "@/server/tasks";

const SYSTEM_PROMPTS: Record<string, string> = {
  ask: "You are Fury Agent in ASK mode. Explain code and answer questions. Never claim to modify files or run commands.",
  plan: "You are Fury Agent in PLAN mode. Produce an implementation plan with affected files and risks. Never claim to modify files or run commands.",
};

export async function loadTaskRow(taskId: string) {
  const db = getDb();
  if (db && isDbConfigured()) {
    const rows = await db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).limit(1);
    return rows[0] ?? null;
  }
  return store.tasks.get(taskId) ?? null;
}

export async function loadProvidersFor(userId: string): Promise<ProviderConfig[]> {
  const db = getDb();
  if (db && isDbConfigured()) {
    return (await db.select().from(schema.providerConfigs).where(eq(schema.providerConfigs.userId, userId))) as unknown as ProviderConfig[];
  }
  return [...store.providers.values()].filter((p) => p.userId === userId) as unknown as ProviderConfig[];
}

export async function loadTaskHistory(taskId: string): Promise<Array<{ role: string; content: string }>> {
  const db = getDb();
  if (db && isDbConfigured()) {
    const rows = await db.select().from(schema.agentMessages).where(eq(schema.agentMessages.taskId, taskId));
    return rows.map((r) => ({ role: r.role, content: r.content }));
  }
  return store.agentMessages.filter((m) => m.taskId === taskId).map((m) => ({ role: m.role, content: m.content }));
}

async function persistMessage(taskId: string, role: string, content: string) {
  const db = getDb();
  if (db && isDbConfigured()) {
    await db.insert(schema.agentMessages).values({ taskId, role, content });
    return;
  }
  store.agentMessages.push({ id: store.id(), taskId, role, content, createdAt: store.now() });
}

async function persist(taskId: string, userId: string, provider: ProviderConfig, content: string, promptTokens: number, completionTokens: number) {
  const db = getDb();
  if (db && isDbConfigured()) {
    await db.insert(schema.agentMessages).values({ taskId, role: "assistant", content });
    await db.insert(schema.modelUsage).values({ userId, providerId: provider.id, modelId: provider.modelId, promptTokens, completionTokens });
    await db.insert(schema.taskEvents).values({ taskId, type: "model", message: `Streamed reply from ${provider.modelId}`, data: { promptTokens, completionTokens } as any });
    await db.update(schema.tasks).set({ status: "completed", updatedAt: new Date() }).where(eq(schema.tasks.id, taskId));
    return;
  }
  store.agentMessages.push({ id: store.id(), taskId, role: "assistant", content, createdAt: store.now() });
  store.modelUsage.push({ id: store.id(), userId, providerId: provider.id, modelId: provider.modelId, promptTokens, completionTokens, createdAt: store.now() });
  store.taskEvents.push({ id: store.id(), taskId, type: "model", message: `Streamed reply from ${provider.modelId}`, createdAt: store.now() });
  const t = store.tasks.get(taskId);
  if (t) { t.status = "completed"; t.updatedAt = store.now(); store.tasks.set(taskId, t); }
}

/** Build a text/plain streaming response for a task's conversational reply. */
export async function streamTaskReply(task: any): Promise<Response> {
  if (task.mode === "agent") {
    return Response.json({ error: "AGENT mode runs through the bounded step endpoint so tools can be approved." }, { status: 400 });
  }
  if (isTerminal(task.status) && task.status !== "completed") {
    return Response.json({ error: `Task is ${task.status}. Resume it before streaming a reply.` }, { status: 400 });
  }

  const providers = await loadProvidersFor(task.userId);
  const provider = pickProvider(providers, task.mode === "plan" ? "planning" : "default", task.providerId ?? undefined);
  if (!provider) {
    return Response.json({ error: "No enabled AI provider configured. Add one in Providers." }, { status: 400 });
  }

  let history = await loadTaskHistory(task.id);
  if (history.length === 0) {
    if (!task.prompt) return Response.json({ error: "Task has no prompt yet." }, { status: 400 });
    await persistMessage(task.id, "user", task.prompt);
    history = [{ role: "user", content: task.prompt }];
  }
  const memory = await buildMemoryContext(task.projectId ?? null);
  const messages = [
    { role: "system", content: [SYSTEM_PROMPTS[task.mode] ?? SYSTEM_PROMPTS.ask, "There is no shell: never claim to execute commands, builds or tests.", memory].filter(Boolean).join("\n\n") },
    ...compressHistory(history),
  ];

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      let full = "";
      let promptTokens = 0;
      let completionTokens = 0;
      try {
        const result = await streamChat(provider, messages, (token) => {
          full += token;
          controller.enqueue(encoder.encode(token));
        });
        full = result.content || full;
        promptTokens = result.promptTokens;
        completionTokens = result.completionTokens;
      } catch (e: any) {
        const msg = `\n\n[stream error] ${e?.message ?? "provider failed"}`;
        controller.enqueue(encoder.encode(msg));
        full += msg;
      } finally {
        await persist(task.id, task.userId, provider, full, promptTokens, completionTokens).catch(() => {});
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
