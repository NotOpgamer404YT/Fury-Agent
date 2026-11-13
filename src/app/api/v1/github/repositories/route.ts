import { requireUser } from "@/lib/auth";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import { store } from "@/lib/store";
import { ok, fail, serverError } from "@/lib/api";
import { githubClientFromEncrypted } from "@/lib/github";

export const maxDuration = 30;

export async function GET() {
  try {
    const user = await requireUser();
    let encrypted: string | undefined;
    const db = getDb();
    if (db && isDbConfigured()) {
      const rows = await db.select().from(schema.githubConnections).where(eq(schema.githubConnections.userId, user.id)).limit(1);
      encrypted = rows[0]?.accessTokenEncrypted;
    } else {
      encrypted = store.githubConnections.get(user.id)?.accessTokenEncrypted;
    }
    if (!encrypted) return ok({ connected: false, repositories: [] });

    const gh = githubClientFromEncrypted(encrypted);
    const [me, repos] = await Promise.all([gh.me(), gh.listRepos()]);
    return ok({
      connected: true,
      login: me.login,
      repositories: repos.map((r: any) => ({
        id: r.id, name: r.name, fullName: r.full_name, owner: r.owner.login, private: r.private,
        defaultBranch: r.default_branch, language: r.language, updatedAt: r.updated_at, description: r.description,
      })),
    });
  } catch (e) { return serverError(e); }
}

export async function DELETE() {
  try {
    const user = await requireUser();
    const db = getDb();
    if (db && isDbConfigured()) {
      await db.delete(schema.githubConnections).where(eq(schema.githubConnections.userId, user.id));
    } else {
      store.githubConnections.delete(user.id);
    }
    return ok({ disconnected: true });
  } catch (e) { return serverError(e); }
}

void fail;
