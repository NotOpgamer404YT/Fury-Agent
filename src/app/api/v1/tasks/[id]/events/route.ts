import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq, and, asc } from "drizzle-orm";
import { store } from "@/lib/store";
import { ok, fail, serverError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const db = getDb();
    if (db && isDbConfigured()) {
      const t = await db.select({ id: schema.tasks.id }).from(schema.tasks).where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id))).limit(1);
      if (!t[0]) return fail("Task not found", 404);
      const events = await db.select().from(schema.taskEvents).where(eq(schema.taskEvents.taskId, id)).orderBy(asc(schema.taskEvents.createdAt));
      return ok({ events });
    }
    const task = store.tasks.get(id);
    if (!task || task.userId !== user.id) return fail("Task not found", 404);
    return ok({ events: store.taskEvents.filter((e) => e.taskId === id) });
  } catch (e) { return serverError(e); }
}
