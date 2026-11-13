import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq, and } from "drizzle-orm";
import { store } from "@/lib/store";
import { ok, fail, serverError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const db = getDb();
    if (db && isDbConfigured()) {
      const rows = await db.select().from(schema.projects).where(and(eq(schema.projects.id, id), eq(schema.projects.userId, user.id))).limit(1);
      if (!rows[0]) return fail("Project not found", 404);
      return ok({ project: rows[0] });
    }
    const p = store.projects.get(id);
    if (!p || p.userId !== user.id) return fail("Project not found", 404);
    return ok({ project: p });
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const db = getDb();
    if (db && isDbConfigured()) {
      const rows = await db.delete(schema.projects).where(and(eq(schema.projects.id, id), eq(schema.projects.userId, user.id))).returning();
      if (!rows[0]) return fail("Project not found", 404);
      return ok({ deleted: true });
    }
    const p = store.projects.get(id);
    if (!p || p.userId !== user.id) return fail("Project not found", 404);
    store.projects.delete(id);
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
