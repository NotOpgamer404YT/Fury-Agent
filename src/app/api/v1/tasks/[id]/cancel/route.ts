import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq, and } from "drizzle-orm";
import { store } from "@/lib/store";
import { ok, fail, serverError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const db = getDb();
    if (db && isDbConfigured()) {
      const rows = await db.update(schema.tasks).set({ status: "cancelled", updatedAt: new Date() }).where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id))).returning();
      if (!rows[0]) return fail("Task not found", 404);
      return ok({ task: rows[0] });
    }
    const t = store.tasks.get(id);
    if (!t || t.userId !== user.id) return fail("Task not found", 404);
    t.status = "cancelled"; t.updatedAt = store.now();
    store.tasks.set(id, t);
    return ok({ task: t });
  } catch (e) { return serverError(e); }
}
