import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { providerSchema } from "@/lib/validation";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq, desc } from "drizzle-orm";
import { store } from "@/lib/store";
import { ok, serverError } from "@/lib/api";
import { encrypt, isEncryptionConfigured } from "@/lib/encryption";
import { publicProvider } from "@/lib/serializers";

export async function GET() {
  try {
    const user = await requireUser();
    const db = getDb();
    if (db && isDbConfigured()) {
      const rows = await db.select().from(schema.providerConfigs).where(eq(schema.providerConfigs.userId, user.id)).orderBy(desc(schema.providerConfigs.priority));
      return ok({ providers: rows.map(publicProvider), encryptionConfigured: isEncryptionConfigured() });
    }
    const rows = [...store.providers.values()].filter((p) => p.userId === user.id);
    return ok({ providers: rows.map(publicProvider), encryptionConfigured: isEncryptionConfigured() });
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = providerSchema.parse(await req.json());
    if (!body.apiKey && !isEncryptionConfigured()) {
      return Response.json({ error: "ENCRYPTION_KEY must be configured server-side to store API keys." }, { status: 400 });
    }
    const apiKeyEncrypted = body.apiKey ? encrypt(body.apiKey) : null;
    const db = getDb();
    if (db && isDbConfigured()) {
      const rows = await db.insert(schema.providerConfigs).values({
        userId: user.id, name: body.name, providerType: body.providerType, baseUrl: body.baseUrl,
        apiKeyEncrypted, modelId: body.modelId, contextWindow: body.contextWindow,
        maxOutputTokens: body.maxOutputTokens, supportsTools: body.supportsTools,
        supportsStreaming: body.supportsStreaming, temperature: String(body.temperature),
        timeoutMs: body.timeoutMs, priority: body.priority, enabled: body.enabled,
        isDefault: body.isDefault, isCoding: body.isCoding, isPlanning: body.isPlanning, isReview: body.isReview,
      }).returning();
      return ok({ provider: publicProvider(rows[0]) }, { status: 201 });
    }
    const id = store.id();
    const provider = { id, userId: user.id, ...body, temperature: String(body.temperature), apiKeyEncrypted, createdAt: store.now(), updatedAt: store.now() };
    store.providers.set(id, provider);
    return ok({ provider: publicProvider(provider) }, { status: 201 });
  } catch (e) { return serverError(e); }
}
