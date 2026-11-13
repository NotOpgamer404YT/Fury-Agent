import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { providerSchema } from "@/lib/validation";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq, and } from "drizzle-orm";
import { store } from "@/lib/store";
import { ok, fail, serverError } from "@/lib/api";
import { encrypt } from "@/lib/encryption";
import { publicProvider } from "@/lib/serializers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = providerSchema.partial().parse(await req.json());
    const update: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of ["name", "providerType", "baseUrl", "modelId", "contextWindow", "maxOutputTokens", "supportsTools", "supportsStreaming", "timeoutMs", "priority", "enabled", "isDefault", "isCoding", "isPlanning", "isReview"] as const) {
      if (body[k] !== undefined) update[k] = body[k];
    }
    if (body.temperature !== undefined) update.temperature = String(body.temperature);
    if (body.apiKey) update.apiKeyEncrypted = encrypt(body.apiKey);

    const db = getDb();
    if (db && isDbConfigured()) {
      const rows = await db.update(schema.providerConfigs).set(update).where(and(eq(schema.providerConfigs.id, id), eq(schema.providerConfigs.userId, user.id))).returning();
      if (!rows[0]) return fail("Provider not found", 404);
      return ok({ provider: publicProvider(rows[0]) });
    }
    const p = store.providers.get(id);
    if (!p || p.userId !== user.id) return fail("Provider not found", 404);
    Object.assign(p, update, { updatedAt: store.now() });
    store.providers.set(id, p);
    return ok({ provider: publicProvider(p) });
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const db = getDb();
    if (db && isDbConfigured()) {
      const rows = await db.delete(schema.providerConfigs).where(and(eq(schema.providerConfigs.id, id), eq(schema.providerConfigs.userId, user.id))).returning();
      if (!rows[0]) return fail("Provider not found", 404);
      return ok({ deleted: true });
    }
    const p = store.providers.get(id);
    if (!p || p.userId !== user.id) return fail("Provider not found", 404);
    store.providers.delete(id);
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
