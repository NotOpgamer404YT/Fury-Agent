import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { store } from "@/lib/store";
import { encrypt } from "@/lib/encryption";
import { runAgentStep, approvePendingTool } from "@/server/agents";

beforeAll(() => {
  delete process.env.DATABASE_URL;
  process.env.ENCRYPTION_KEY = "b".repeat(64);
});

let captured: any[] = [];

function seedTask(over: Record<string, unknown> = {}) {
  const userId = "u-agent";
  const providerId = "p-agent";
  if (!store.providers.has(providerId)) {
    store.providers.set(providerId, {
      id: providerId, userId, name: "Mock", providerType: "custom",
      baseUrl: "https://mock.local/v1", apiKeyEncrypted: encrypt("test-key"), modelId: "mock-model",
      contextWindow: 8000, maxOutputTokens: 512, supportsTools: true, supportsStreaming: true,
      temperature: "0.2", timeoutMs: 5000, priority: 10, enabled: true,
      isDefault: true, isCoding: false, isPlanning: false, isReview: false,
    });
  }
  const id = store.id();
  const task = {
    id, userId, projectId: null, title: "t", prompt: "APPROVE_TEST explain auth", mode: "ask",
    status: "pending", providerId: null, modelId: null, state: {}, stepCount: 0, maxSteps: 5,
    lockedAt: null, lastError: null, createdAt: store.now(), updatedAt: store.now(), ...over,
  };
  store.tasks.set(id, task);
  return task;
}

type StubToolCall = { id: string; name: string; args: Record<string, unknown> };

function stubModel(reply: { content?: string; toolCalls?: StubToolCall[] }) {
  captured = [];
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    captured.push(JSON.parse(String(init.body)));
    return new Response(JSON.stringify({
      choices: [{
        message: {
          role: "assistant",
          content: reply.content ?? "",
          // Provider-shaped tool calls (OpenAI-compatible wire format).
          tool_calls: reply.toolCalls?.map((tc) => ({
            id: tc.id, type: "function",
            function: { name: tc.name, arguments: JSON.stringify(tc.args) },
          })),
        },
      }],
      usage: { prompt_tokens: 11, completion_tokens: 7 },
    }), { status: 200, headers: { "content-type": "application/json" } });
  });
}

afterEach(() => { vi.unstubAllGlobals(); });

describe("agent step", () => {
  it("sends the task prompt to the model on the first step", async () => {
    stubModel({ content: "Here is the explanation." });
    const task = seedTask();
    const result = await runAgentStep(task.id);
    expect(result.status).toBe("completed");
    const sent = captured[0].messages as Array<{ role: string; content: string }>;
    expect(sent.some((m) => m.role === "user" && m.content.includes("APPROVE_TEST explain auth"))).toBe(true);
    expect(sent[0].role).toBe("system");
  });

  it("records usage and messages, then completes without tool calls", async () => {
    stubModel({ content: "Done." });
    const task = seedTask({ prompt: "plain ask" });
    await runAgentStep(task.id);
    const updated = store.tasks.get(task.id)!;
    expect(updated.status).toBe("completed");
    expect(updated.stepCount).toBe(1);
    const msgs = store.agentMessages.filter((m) => m.taskId === task.id);
    expect(msgs.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(store.modelUsage.some((u) => u.userId === "u-agent" && u.promptTokens === 11)).toBe(true);
  });

  it("executes read-only tools and loops again", async () => {
    stubModel({
      content: "",
      toolCalls: [{ id: "c1", name: "generate_patch", args: { path: "a.ts", before: "a", after: "b" } }],
    });
    const task = seedTask({ prompt: "patch please", mode: "plan" });
    const r1 = await runAgentStep(task.id);
    expect(r1.status).toBe("running");
    expect(store.agentMessages.some((m) => m.taskId === task.id && m.role === "tool" && m.toolName === "generate_patch")).toBe(true);
  });

  it("pauses AGENT mode write tools for approval instead of executing them", async () => {
    stubModel({
      content: "",
      toolCalls: [{ id: "c2", name: "create_file", args: { path: "new.ts", content: "x" } }],
    });
    const task = seedTask({ prompt: "create a file", mode: "agent" });
    const r = await runAgentStep(task.id);
    expect(r.status).toBe("waiting_approval");
    const updated = store.tasks.get(task.id)!;
    expect(updated.state.pendingTool.name).toBe("create_file");
    // Nothing was executed against the repository.
    expect(store.agentMessages.filter((m) => m.taskId === task.id && m.role === "tool")).toHaveLength(0);
    // Rejecting resumes the task without executing the tool.
    const rejection = await approvePendingTool(task.id, false);
    expect(rejection.status).toBe("running");
    expect(store.tasks.get(task.id)!.state.pendingTool).toBeNull();
  });

  it("rejects tools that are not allowed in ASK mode", async () => {
    stubModel({
      content: "",
      toolCalls: [{ id: "c3", name: "create_commit", args: { files: [{ path: "a", content: "b" }], message: "m" } }],
    });
    const task = seedTask({ prompt: "commit it", mode: "ask" });
    await runAgentStep(task.id);
    const events = store.taskEvents.filter((e) => e.taskId === task.id);
    expect(events.some((e) => e.type === "tool_error" && /not allowed/i.test(e.message))).toBe(true);
    expect(store.agentMessages.some((m) => m.taskId === task.id && m.toolName === "create_commit")).toBe(false);
  });

  it("marks the task failed when no provider is enabled", async () => {
    const task = seedTask({ prompt: "hi", userId: "user-without-provider" });
    const r = await runAgentStep(task.id);
    expect(r.status).toBe("failed");
    expect(store.tasks.get(task.id)!.lastError).toMatch(/provider/i);
  });
});
