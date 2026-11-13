import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq, and } from "drizzle-orm";
import { store } from "@/lib/store";
import { ok, fail, serverError } from "@/lib/api";
import { approvePendingTool } from "@/server/agents";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };
const bodySchema = z.object({ approved: z.boolean() });

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { approved } = bodySchema.parse(await req.json().catch(() => ({})));
    const db = getDb();
    if (db && isDbConfigured()) {
      const rows = await db.select({ id: schema.tasks.id }).from(schema.tasks).where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id))).limit(1);
      if (!rows[0]) return fail("Task not found", 404);
    } else {
      const t = store.tasks.get(id);
      if (!t || t.userId !== user.id) return fail("Task not found", 404);
    }
    return ok(await approvePendingTool(id, approved));
  } catch (e) { return serverError(e); }
}
