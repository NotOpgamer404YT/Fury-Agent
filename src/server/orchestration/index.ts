/**
 * Orchestration helpers around the agent engine.
 *
 * Serverless rules encoded here:
 *  - one bounded step per invocation;
 *  - retries are explicit and bounded;
 *  - no in-memory queue is treated as the source of truth (the DB task row is);
 *  - the client drives progress by calling the step endpoint.
 */
import { runAgentStep, resetTaskForRetry } from "@/server/agents";
import { isTerminal } from "@/server/tasks";

export type StepOutcome = { status: string; step: number; message: string; attempts: number };

/** Run one step, retrying transient provider/network failures a bounded number of times. */
export async function stepWithRetry(taskId: string, maxAttempts = 2): Promise<StepOutcome> {
  let last: StepOutcome = { status: "failed", step: 0, message: "No attempt executed", attempts: 0 };
  let lastFailure = "";
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const r = await runAgentStep(taskId);
      // Ignore the "already finished" echo produced by a retry loop.
      if (!(r.status === "failed" && r.message === "Task already finished")) {
        last = { ...r, attempts: attempt };
      }
      // Only retry genuine transport-shaped failures; business outcomes are final.
      if (r.status !== "failed" || !isTransient(r.message)) return last;
      lastFailure = r.message;
    } catch (e: any) {
      lastFailure = e?.message ?? "step crashed";
      last = { status: "failed", step: last.step, message: lastFailure, attempts: attempt };
      if (!isTransient(lastFailure)) return last;
    }
    if (attempt < maxAttempts) await resetTaskForRetry(taskId);
  }
  return lastFailure ? { status: "failed", step: last.step, message: lastFailure, attempts: maxAttempts } : last;
}

function isTransient(message: string): boolean {
  return /timed out|Could not reach|fetch failed|ECONNRESET|ETIMEDOUT|HTTP 429|HTTP 5\d\d/i.test(message);
}

/** How many more client-driven steps are sensible before giving up on a task. */
export function remainingSteps(stepCount: number, maxSteps: number): number {
  return Math.max(0, maxSteps - stepCount);
}

export { isTerminal };
