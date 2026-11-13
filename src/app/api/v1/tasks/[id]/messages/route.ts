import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq, and, asc } from "drizzle-orm";
import { store } from "@/lib/store";
import { ok, fail, serverError } from "@/lib/api";
import { z } from "zod";
import { isTerminal } from "@/server/tasks";

export const maxDuration = 60;
type Params = { params: Promise<{ id: string }> };
const bodySchema = z.object({ content: z.string().min(1).max(8000) });

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const db = getDb();
    if (db && isDbConfigured()) {
      const t = await db.select({ id: schema.tasks.id }).from(schema.tasks).where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id))).limit(1);
      if (!t[0]) return fail("Task not found", 404);
      const messages = await db.select().from(schema.agentMessages).where(eq(schema.agentMessages.taskId, id)).orderBy(asc(schema.agentMessages.createdAt));
      return ok({ messages });
    }
    const t = store.tasks.get(id);
    if (!t || t.userId !== user.id) return fail("Task not found", 404);
    return ok({ messages: store.agentMessages.filter((m) => m.taskId === id) });
  } catch (e) { return serverError(e); }
}

/** Follow-up instruction. Reopens a finished task so the next step continues the conversation. */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { content } = bodySchema.parse(await req.json());
    const db = getDb();

    if (db && isDbConfigured()) {
      const rows = await db.select().from(schema.tasks).where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id))).limit(1);
      const task = rows[0];
      if (!task) return fail("Task not found", 404);
      await db.insert(schema.agentMessages).values({ taskId: id, role: "user", content });
      if (isTerminal(task.status)) {
        await db.update(schema.tasks).set({ status: "running", lastError: null, lockedAt: null, updatedAt: new Date() }).where(eq(schema.tasks.id, id));
      }
      await db.insert(schema.taskEvents).values({ taskId: id, type: "message", message: "Follow-up instruction received" });
      return ok({ accepted: true });
    }

    const task = store.tasks.get(id);
    if (!task || task.userId !== user.id) return fail("Task not found", 404);
    store.agentMessages.push({ id: store.id(), taskId: id, role: "user", content, createdAt: store.now() });
    if (isTerminal(task.status)) { task.status = "running"; task.lastError = null; task.lockedAt = null; }
    store.taskEvents.push({ id: store.id(), taskId: id, type: "message", message: "Follow-up instruction received", createdAt: store.now() });
    store.tasks.set(id, task);
    return ok({ accepted: true });
  } catch (e) { return serverError(e); }
}
