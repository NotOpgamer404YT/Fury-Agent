import { requireUser } from "@/lib/auth";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import { store } from "@/lib/store";
import { ok, serverError } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const db = getDb();
    let rows: any[] = [];
    if (db && isDbConfigured()) {
      rows = await db.select().from(schema.modelUsage).where(eq(schema.modelUsage.userId, user.id));
    } else {
      rows = store.modelUsage.filter((r) => r.userId === user.id);
    }
    const byModel = new Map<string, { model: string; promptTokens: number; completionTokens: number; calls: number }>();
    for (const r of rows) {
      const e = byModel.get(r.modelId) ?? { model: r.modelId, promptTokens: 0, completionTokens: 0, calls: 0 };
      e.promptTokens += r.promptTokens; e.completionTokens += r.completionTokens; e.calls += 1;
      byModel.set(r.modelId, e);
    }
    const totals = [...byModel.values()].reduce((a, b) => ({ prompt: a.prompt + b.promptTokens, completion: a.completion + b.completionTokens }), { prompt: 0, completion: 0 });
    return ok({ totals: { ...totals, calls: rows.length }, byModel: [...byModel.values()] });
  } catch (e) { return serverError(e); }
}
