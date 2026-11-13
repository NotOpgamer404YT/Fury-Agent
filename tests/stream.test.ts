import { describe, it, expect, beforeAll } from "vitest";
import { streamTaskReply } from "@/server/agents/stream";

beforeAll(() => { delete process.env.DATABASE_URL; });

function task(over: Record<string, unknown> = {}) {
  return { id: "t1", userId: "u1", mode: "ask", status: "pending", prompt: "hello", projectId: null, providerId: null, ...over };
}

describe("streaming guard rails", () => {
  it("refuses to stream AGENT mode", async () => {
    const res = await streamTaskReply(task({ mode: "agent" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: expect.stringMatching(/AGENT mode/i) });
  });

  it("refuses to stream a failed task", async () => {
    const res = await streamTaskReply(task({ status: "failed" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: expect.stringMatching(/failed/i) });
  });

  it("refuses when no provider is configured", async () => {
    const res = await streamTaskReply(task());
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: expect.stringMatching(/provider/i) });
  });
});
