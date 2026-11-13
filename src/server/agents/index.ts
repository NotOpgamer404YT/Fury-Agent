/**
 * Agent orchestration — persistent state machine.
 * Statuses: pending → planning → running → (waiting_approval) → reviewing → completed | failed | cancelled
 * Each invocation runs ONE bounded step and persists a checkpoint, so execution
 * survives serverless function termination. Clients poll /step to continue.
 */
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq, and, desc } from "drizzle-orm";
import { store } from "@/lib/store";
import { chatCompletion, pickProvider, type ProviderConfig } from "@/server/providers";
import { getTool, isToolAllowed, toolDefinitionsForModel, type ToolContext } from "@/server/tools";
import { githubClientFromEncrypted } from "@/lib/github";
import { encrypt } from "@/lib/encryption";
import { buildMemoryContext, compressHistory, saveMemory } from "@/server/memory";
import { isTerminal } from "@/server/tasks";

export type TaskStatus = "pending" | "planning" | "running" | "waiting_approval" | "reviewing" | "completed" | "failed" | "cancelled";

async function loadProviders(userId: string): Promise<ProviderConfig[]> {
  const db = getDb();
  if (db && isDbConfigured()) {
    const rows = await db.select().from(schema.providerConfigs).where(eq(schema.providerConfigs.userId, userId));
    return rows as unknown as ProviderConfig[];
  }
  return [...store.providers.values()].filter((p) => p.userId === userId) as unknown as ProviderConfig[];
}

async function loadTask(taskId: string): Promise<any | null> {
  const db = getDb();
  if (db && isDbConfigured()) {
    const rows = await db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).limit(1);
    return rows[0] ?? null;
  }
  return store.tasks.get(taskId) ?? null;
}

async function saveTask(task: any): Promise<void> {
  const db = getDb();
  if (db && isDbConfigured()) {
    await db.update(schema.tasks).set({ status: task.status, state: task.state, stepCount: task.stepCount, lastError: task.lastError ?? null, updatedAt: new Date() }).where(eq(schema.tasks.id, task.id));
    return;
  }
  store.tasks.set(task.id, task);
}

async function addEvent(taskId: string, type: string, message: string, data?: unknown): Promise<void> {
  const db = getDb();
  if (db && isDbConfigured()) {
    await db.insert(schema.taskEvents).values({ taskId, type, message, data: (data ?? null) as any });
    return;
  }
  store.taskEvents.push({ id: store.id(), taskId, type, message, data, createdAt: store.now() });
}

async function addMessage(taskId: string, role: string, content: string, toolName?: string, toolCallId?: string): Promise<void> {
  const db = getDb();
  if (db && isDbConfigured()) {
    await db.insert(schema.agentMessages).values({ taskId, role, content, toolName: toolName ?? null, toolCallId: toolCallId ?? null });
    return;
  }
  store.agentMessages.push({ id: store.id(), taskId, role, content, toolName, toolCallId, createdAt: store.now() });
}

async function recordUsage(userId: string, provider: ProviderConfig, promptTokens: number, completionTokens: number): Promise<void> {
  const db = getDb();
  if (db && isDbConfigured()) {
    await db.insert(schema.modelUsage).values({ userId, providerId: provider.id, modelId: provider.modelId, promptTokens, completionTokens });
    return;
  }
  store.modelUsage.push({ id: store.id(), userId, providerId: provider.id, modelId: provider.modelId, promptTokens, completionTokens, createdAt: store.now() });
}

async function loadHistory(taskId: string): Promise<Array<{ role: string; content: string }>> {
  const db = getDb();
  if (db && isDbConfigured()) {
    const rows = await db.select().from(schema.agentMessages).where(eq(schema.agentMessages.taskId, taskId)).orderBy(desc(schema.agentMessages.createdAt)).limit(40);
    return rows.reverse().map((r) => ({ role: r.role, content: r.content }));
  }
  return store.agentMessages.filter((m) => m.taskId === taskId).slice(-40).map((m) => ({ role: m.role, content: m.content }));
}

async function buildToolContext(task: any): Promise<ToolContext> {
  let owner: string | null = null, repo: string | null = null, branch = "main";
  let github: ToolContext["github"] = null;
  const db = getDb();
  if (task.projectId) {
    if (db && isDbConfigured()) {
      const rows = await db.select().from(schema.projects).where(eq(schema.projects.id, task.projectId)).limit(1);
      const p = rows[0];
      if (p) { owner = p.owner ?? null; repo = p.repo ?? null; branch = p.defaultBranch ?? "main"; }
    } else {
      const p = store.projects.get(task.projectId);
      if (p) { owner = p.owner ?? null; repo = p.repo ?? null; branch = p.defaultBranch ?? "main"; }
    }
  }
  // GitHub connection for the task owner
  if (db && isDbConfigured()) {
    const rows = await db.select().from(schema.githubConnections).where(eq(schema.githubConnections.userId, task.userId)).limit(1);
    if (rows[0]) github = githubClientFromEncrypted(rows[0].accessTokenEncrypted);
  } else {
    const conn = store.githubConnections.get(task.userId);
    if (conn) github = githubClientFromEncrypted(conn.accessTokenEncrypted);
  }
  // Task branch checkpoint
  if (task.state?.branch) branch = task.state.branch;
  return { owner, repo, branch, github, mode: task.mode };
}

const SYSTEM_PROMPTS: Record<string, string> = {
  ask: "You are Fury Agent in ASK mode. Explain code and answer questions. You may use read-only tools. Never modify files.",
  plan: "You are Fury Agent in PLAN mode. Analyze the project, create an implementation plan, identify affected files and risks. Do not modify files. Use read-only tools.",
  agent: "You are Fury Agent in AGENT mode. Complete the coding task step by step using tools. Prefer small, reviewable changes. Summarize progress concisely. Never expose hidden reasoning.",
};

/** Run one bounded agent step. Returns the updated task summary. */
export async function runAgentStep(taskId: string): Promise<{ status: string; step: number; message: string }> {
  const task = await loadTask(taskId);
  if (!task) throw new Error("Task not found");
  if (isTerminal(task.status)) return { status: task.status, step: task.stepCount, message: task.lastError ?? "Task already finished" };
  if (task.status === "waiting_approval") return { status: task.status, step: task.stepCount, message: "Waiting for approval" };

  // Concurrency lock (checkpoint): 5-minute lease
  const now = new Date();
  if (task.lockedAt && new Date(task.lockedAt).getTime() > now.getTime() - 5 * 60 * 1000) {
    return { status: task.status, step: task.stepCount, message: "Task is being processed by another invocation" };
  }
  task.lockedAt = now.toISOString();
  await saveTask(task);

  try {
    if (task.stepCount >= task.maxSteps) {
      task.status = "failed"; task.lastError = "Max steps reached";
      await addEvent(taskId, "failed", "Max steps reached");
      await saveTask(task);
      return { status: "failed", step: task.stepCount, message: "Max steps reached" };
    }

    const providers = await loadProviders(task.userId);
    const role = task.mode === "plan" ? "planning" : task.mode === "agent" ? "coding" : "default";
    const provider = pickProvider(providers, role as any, task.providerId ?? undefined);
    if (!provider) {
      task.status = "failed"; task.lastError = "No enabled AI provider configured. Add one in Settings → Providers.";
      await addEvent(taskId, "failed", task.lastError);
      await saveTask(task);
      return { status: "failed", step: task.stepCount, message: task.lastError };
    }

    if (task.status === "pending") { task.status = "planning"; await addEvent(taskId, "planning", "Planning started"); }
    else if (task.status === "planning") { task.status = "running"; await addEvent(taskId, "running", "Execution started"); }

    const history = await loadHistory(taskId);
    if (history.length === 0) await addMessage(taskId, "user", task.prompt);

    const ctx = await buildToolContext(task);
    const memory = await buildMemoryContext(task.projectId ?? null);
    const toolsAllowed = toolDefinitionsForModel(task.mode).map((t) => t.function.name).join(", ");
    const systemContent = [
      SYSTEM_PROMPTS[task.mode] ?? SYSTEM_PROMPTS.ask,
      `Available tools: ${toolsAllowed}. File tools use repository-relative paths.`,
      ctx.owner ? `Repository: ${ctx.owner}/${ctx.repo} (branch ${ctx.branch}).` : "No repository is linked, so file tools are unavailable. Say so plainly if they are needed.",
      "Never claim to have run shell commands, builds or tests: there is no shell in this environment.",
      memory,
    ].filter(Boolean).join("\n\n");
    const messages = [
      { role: "system", content: systemContent },
      ...compressHistory(history),
    ];

    const result = await chatCompletion(provider, messages, { tools: toolDefinitionsForModel(task.mode) });
    await recordUsage(task.userId, provider, result.promptTokens, result.completionTokens);
    task.stepCount += 1;

    if (result.content) await addMessage(taskId, "assistant", result.content);
    await addEvent(taskId, "model", `Model ${provider.modelId} responded`, { tokens: result.promptTokens + result.completionTokens });

    // Execute tool calls (validated + permission-checked)
    if (result.toolCalls?.length) {
      for (const tc of result.toolCalls) {
        const tool = getTool(tc.name);
        if (!tool) { await addEvent(taskId, "tool_error", `Unknown tool: ${tc.name}`); continue; }
        if (!isToolAllowed(tool, task.mode)) { await addEvent(taskId, "tool_error", `Tool ${tc.name} not allowed in ${task.mode} mode`); continue; }
        const parsed = tool.schema.safeParse(tc.args);
        if (!parsed.success) { await addEvent(taskId, "tool_error", `Invalid args for ${tc.name}: ${parsed.error.message}`); continue; }

        if (tool.needsApproval && task.mode === "agent" && !task.state?.autoApprove) {
          // Pause for approval
          const approvalId = store.id();
          const db = getDb();
          if (db && isDbConfigured()) {
            await db.insert(schema.approvals).values({ id: approvalId, taskId, toolName: tc.name, input: parsed.data as any, status: "pending" });
          } else {
            store.approvals.set(approvalId, { id: approvalId, taskId, toolName: tc.name, input: parsed.data, status: "pending", createdAt: store.now() });
          }
          task.status = "waiting_approval";
          task.state = { ...(task.state ?? {}), pendingTool: { name: tc.name, args: parsed.data, approvalId } };
          await addEvent(taskId, "approval_required", `Approval required for ${tc.name}`, { approvalId });
          await saveTask(task);
          return { status: task.status, step: task.stepCount, message: `Approval required for ${tc.name}` };
        }

        try {
          const output = await tool.execute(ctx, parsed.data);
          await addMessage(taskId, "tool", JSON.stringify(output).slice(0, 20000), tc.name, tc.id);
          await addEvent(taskId, "tool", `${tc.name} executed`, { tool: tc.name });
          // Track branch checkpoint
          if (tc.name === "create_branch") task.state = { ...(task.state ?? {}), branch: (parsed.data as any).branch };
        } catch (e: any) {
          await addMessage(taskId, "tool", `Error: ${e?.message ?? "tool failed"}`, tc.name, tc.id);
          await addEvent(taskId, "tool_error", `${tc.name} failed: ${e?.message ?? "error"}`);
        }
      }
      task.status = "running";
      await saveTask(task);
      return { status: task.status, step: task.stepCount, message: "Tool calls executed" };
    }

    // No tool calls → model gave a final answer. Mark reviewing → completed.
    task.status = "reviewing";
    await addEvent(taskId, "reviewing", "Reviewing changes");
    task.status = "completed";
    await addEvent(taskId, "completed", "Task completed");
    await saveTask(task);
    if (task.projectId) {
      await saveMemory(task.projectId, "task_summary", `${task.mode.toUpperCase()} task "${task.title}": ${(result.content || "no summary").slice(0, 400)}`).catch(() => {});
    }
    return { status: "completed", step: task.stepCount, message: "Task completed" };
  } catch (e: any) {
    task.status = "failed";
    task.lastError = e?.message ?? "Execution failed";
    await addEvent(taskId, "failed", task.lastError);
    await saveTask(task);
    return { status: "failed", step: task.stepCount, message: task.lastError };
  } finally {
    const fresh = await loadTask(taskId);
    if (fresh) { fresh.lockedAt = null; await saveTask(fresh); }
  }
}

/** Clear a transient failure so a bounded retry can run the same task again. */
export async function resetTaskForRetry(taskId: string): Promise<boolean> {
  const task = await loadTask(taskId);
  if (!task || !isTerminal(task.status)) return false;
  task.status = "running";
  task.lastError = null;
  task.lockedAt = null;
  await addEvent(taskId, "retry", "Retrying after a transient failure");
  await saveTask(task);
  return true;
}

/** Execute a previously-approved pending tool and resume. */
export async function approvePendingTool(taskId: string, approved: boolean): Promise<{ status: string; message: string }> {
  const task = await loadTask(taskId);
  if (!task || task.status !== "waiting_approval") throw new Error("No pending approval for this task");
  const pending = task.state?.pendingTool;
  if (!pending) throw new Error("No pending tool");
  const db = getDb();
  if (db && isDbConfigured()) {
    await db.update(schema.approvals).set({ status: approved ? "approved" : "rejected", decidedAt: new Date() }).where(eq(schema.approvals.id, pending.approvalId));
  } else {
    const a = store.approvals.get(pending.approvalId);
    if (a) { a.status = approved ? "approved" : "rejected"; a.decidedAt = store.now(); }
  }
  if (!approved) {
    task.status = "running";
    task.state = { ...(task.state ?? {}), pendingTool: null };
    await addEvent(taskId, "approval_rejected", `Rejected ${pending.name}`);
    await saveTask(task);
    return { status: task.status, message: "Tool rejected; task resumed" };
  }
  const tool = getTool(pending.name);
  if (!tool) throw new Error("Unknown tool");
  const ctx = await buildToolContext(task);
  try {
    const output = await tool.execute(ctx, pending.args);
    await addMessage(taskId, "tool", JSON.stringify(output).slice(0, 20000), pending.name);
    await addEvent(taskId, "tool", `${pending.name} executed after approval`);
    if (pending.name === "create_branch") task.state = { ...(task.state ?? {}), branch: pending.args.branch };
  } catch (e: any) {
    await addEvent(taskId, "tool_error", `${pending.name} failed: ${e?.message ?? "error"}`);
  }
  task.status = "running";
  task.state = { ...(task.state ?? {}), pendingTool: null };
  await saveTask(task);
  return { status: task.status, message: "Approved and executed" };
}

export { encrypt };
