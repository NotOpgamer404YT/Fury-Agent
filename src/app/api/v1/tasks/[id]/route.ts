import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq, and, desc } from "drizzle-orm";
import { store } from "@/lib/store";
import { ok, fail, serverError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const db = getDb();
    if (db && isDbConfigured()) {
      const rows = await db.select().from(schema.tasks).where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id))).limit(1);
      if (!rows[0]) return fail("Task not found", 404);
      const messages = await db.select().from(schema.agentMessages).where(eq(schema.agentMessages.taskId, id)).orderBy(schema.agentMessages.createdAt);
      return ok({ task: rows[0], messages });
    }
    const task = store.tasks.get(id);
    if (!task || task.userId !== user.id) return fail("Task not found", 404);
    const messages = store.agentMessages.filter((m) => m.taskId === id);
    return ok({ task, messages });
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const db = getDb();
    if (db && isDbConfigured()) {
      const rows = await db.delete(schema.tasks).where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id))).returning();
      if (!rows[0]) return fail("Task not found", 404);
      return ok({ deleted: true });
    }
    const t = store.tasks.get(id);
    if (!t || t.userId !== user.id) return fail("Task not found", 404);
    store.tasks.delete(id);
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
