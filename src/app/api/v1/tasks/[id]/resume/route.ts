import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq, and } from "drizzle-orm";
import { store } from "@/lib/store";
import { ok, fail, serverError } from "@/lib/api";
import { runAgentStep } from "@/server/agents";

export const maxDuration = 60;
type Params = { params: Promise<{ id: string }> };

/** Resume from last checkpoint: reset terminal states to running and run a step. */
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const db = getDb();
    if (db && isDbConfigured()) {
      const rows = await db.select().from(schema.tasks).where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id))).limit(1);
      const t = rows[0];
      if (!t) return fail("Task not found", 404);
      if (["failed", "cancelled"].includes(t.status)) {
        await db.update(schema.tasks).set({ status: "running", lastError: null, lockedAt: null, updatedAt: new Date() }).where(eq(schema.tasks.id, id));
      }
      return ok(await runAgentStep(id));
    }
    const t = store.tasks.get(id);
    if (!t || t.userId !== user.id) return fail("Task not found", 404);
    if (["failed", "cancelled"].includes(t.status)) { t.status = "running"; t.lastError = null; t.lockedAt = null; store.tasks.set(id, t); }
    void eq; void and;
    return ok(await runAgentStep(id));
  } catch (e) { return serverError(e); }
}
