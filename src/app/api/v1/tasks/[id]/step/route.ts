import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq, and } from "drizzle-orm";
import { store } from "@/lib/store";
import { ok, fail, serverError } from "@/lib/api";
import { stepWithRetry } from "@/server/orchestration";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

/** Advance the agent by ONE bounded step. Client polls this until terminal status. */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const rl = rateLimit(`step:${user.id}`, 30, 60_000);
    if (!rl.ok) return Response.json({ error: "Step rate limit reached. Try again shortly." }, { status: 429 });
    const { id } = await params;

    const db = getDb();
    if (db && isDbConfigured()) {
      const rows = await db.select({ id: schema.tasks.id }).from(schema.tasks).where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id))).limit(1);
      if (!rows[0]) return fail("Task not found", 404);
    } else {
      const t = store.tasks.get(id);
      if (!t || t.userId !== user.id) return fail("Task not found", 404);
    }

    const result = await stepWithRetry(id, 2);
    return ok(result);
  } catch (e) { return serverError(e); }
}
