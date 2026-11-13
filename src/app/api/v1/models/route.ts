import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import { store } from "@/lib/store";
import { ok, serverError } from "@/lib/api";
import { fetchModels, type ProviderConfig } from "@/server/providers";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const providerId = req.nextUrl.searchParams.get("providerId");
    let providers: ProviderConfig[] = [];
    const db = getDb();
    if (db && isDbConfigured()) {
      providers = (await db.select().from(schema.providerConfigs).where(eq(schema.providerConfigs.userId, user.id))) as unknown as ProviderConfig[];
    } else {
      providers = [...store.providers.values()].filter((p) => p.userId === user.id) as unknown as ProviderConfig[];
    }
    const targets = providerId ? providers.filter((p) => p.id === providerId) : providers.filter((p) => p.enabled);
    const out = await Promise.all(targets.map(async (p) => {
      try {
        const models = await fetchModels(p);
        return { providerId: p.id, provider: p.name, models, discoverySupported: models.length > 0 };
      } catch (e: any) {
        return { providerId: p.id, provider: p.name, models: [], discoverySupported: false, error: e?.message ?? "discovery failed" };
      }
    }));
    return ok({ models: out });
  } catch (e) { return serverError(e); }
}
