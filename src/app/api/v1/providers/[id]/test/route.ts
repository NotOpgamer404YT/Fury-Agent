import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq, and } from "drizzle-orm";
import { store } from "@/lib/store";
import { ok, fail, serverError } from "@/lib/api";
import { testProvider, type ProviderConfig } from "@/server/providers";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    let provider: ProviderConfig | undefined;
    const db = getDb();
    if (db && isDbConfigured()) {
      const rows = await db.select().from(schema.providerConfigs).where(and(eq(schema.providerConfigs.id, id), eq(schema.providerConfigs.userId, user.id))).limit(1);
      provider = rows[0] as unknown as ProviderConfig | undefined;
    } else {
      const p = store.providers.get(id);
      if (p && p.userId === user.id) provider = p as unknown as ProviderConfig;
    }
    if (!provider) return fail("Provider not found", 404);

    const result = await testProvider(provider);
    const status = result.ok ? "ok" : "failed";
    if (db && isDbConfigured()) {
      await db.update(schema.providerConfigs).set({ lastTestedAt: new Date(), lastTestStatus: status }).where(eq(schema.providerConfigs.id, id));
    } else {
      provider.lastTestStatus = status;
    }
    return ok(result);
  } catch (e) { return serverError(e); }
}
