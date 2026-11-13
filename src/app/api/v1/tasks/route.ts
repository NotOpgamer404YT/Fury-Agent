import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { taskSchema } from "@/lib/validation";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq, desc } from "drizzle-orm";
import { store } from "@/lib/store";
import { ok, serverError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const status = req.nextUrl.searchParams.get("status");
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 50), 100);
    const db = getDb();
    if (db && isDbConfigured()) {
      const rows = await db.select().from(schema.tasks).where(eq(schema.tasks.userId, user.id)).orderBy(desc(schema.tasks.createdAt)).limit(limit);
      const filtered = status ? rows.filter((r) => r.status === status) : rows;
      return ok({ tasks: filtered });
    }
    const rows = [...store.tasks.values()].filter((t) => t.userId === user.id && (!status || t.status === status)).slice(-limit).reverse();
    return ok({ tasks: rows });
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = taskSchema.parse(await req.json());
    const db = getDb();
    if (db && isDbConfigured()) {
      const rows = await db.insert(schema.tasks).values({
        userId: user.id, projectId: body.projectId ?? null, title: body.title, prompt: body.prompt,
        mode: body.mode, providerId: body.providerId ?? null, modelId: body.modelId ?? null,
        status: "pending", state: {},
      }).returning();
      return ok({ task: rows[0] }, { status: 201 });
    }
    const id = store.id();
    const task = { id, userId: user.id, projectId: body.projectId ?? null, title: body.title, prompt: body.prompt, mode: body.mode, status: "pending", providerId: body.providerId ?? null, modelId: body.modelId ?? null, state: {}, stepCount: 0, maxSteps: 25, createdAt: store.now(), updatedAt: store.now() };
    store.tasks.set(id, task);
    return ok({ task }, { status: 201 });
  } catch (e) { return serverError(e); }
}
