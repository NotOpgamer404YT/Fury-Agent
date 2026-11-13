import { describe, it, expect } from "vitest";
import { TASK_STATUSES, isTerminal, canStep, canResume, nextStatus, STATUS_LABELS } from "@/server/tasks";
import { compressHistory } from "@/server/memory";
import { remainingSteps } from "@/server/orchestration";

describe("task status machine", () => {
  it("matches the documented statuses", () => {
    expect([...TASK_STATUSES]).toEqual([
      "pending", "planning", "running", "waiting_approval", "reviewing", "completed", "failed", "cancelled",
    ]);
  });
  it("identifies terminal states", () => {
    expect(isTerminal("completed")).toBe(true);
    expect(isTerminal("failed")).toBe(true);
    expect(isTerminal("cancelled")).toBe(true);
    expect(isTerminal("running")).toBe(false);
    expect(isTerminal("waiting_approval")).toBe(false);
  });
  it("only steps active tasks", () => {
    expect(canStep("pending")).toBe(true);
    expect(canStep("planning")).toBe(true);
    expect(canStep("running")).toBe(true);
    expect(canStep("completed")).toBe(false);
    expect(canStep("waiting_approval")).toBe(false);
  });
  it("resumes failed and cancelled tasks only", () => {
    expect(canResume("failed")).toBe(true);
    expect(canResume("cancelled")).toBe(true);
    expect(canResume("running")).toBe(false);
  });
  it("advances pending → planning → running → completed", () => {
    expect(nextStatus("pending")).toBe("planning");
    expect(nextStatus("planning")).toBe("running");
    expect(nextStatus("reviewing")).toBe("completed");
  });
  it("labels every status", () => {
    for (const s of TASK_STATUSES) expect(STATUS_LABELS[s]).toBeTruthy();
  });
});

describe("context compression", () => {
  it("trims to the most recent messages", () => {
    const msgs = Array.from({ length: 30 }, (_, i) => ({ role: "user", content: `m${i}` }));
    const out = compressHistory(msgs, 5, 100);
    expect(out).toHaveLength(5);
    expect(out[4].content).toBe("m29");
  });
  it("clamps long content and restates tool output as user context", () => {
    const out = compressHistory([{ role: "tool", content: "x".repeat(500) }], 10, 50);
    expect(out[0].role).toBe("user");
    expect(out[0].content.startsWith("Tool result:")).toBe(true);
    expect(out[0].content.length).toBeLessThan(80);
  });
});

describe("bounded execution", () => {
  it("counts remaining steps", () => {
    expect(remainingSteps(0, 25)).toBe(25);
    expect(remainingSteps(25, 25)).toBe(0);
    expect(remainingSteps(30, 25)).toBe(0);
  });
});
