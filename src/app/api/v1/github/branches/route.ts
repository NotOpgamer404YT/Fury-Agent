import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import { store } from "@/lib/store";
import { ok, fail, serverError } from "@/lib/api";
import { githubClientFromEncrypted } from "@/lib/github";

export const maxDuration = 30;

async function getClient(userId: string) {
  const db = getDb();
  if (db && isDbConfigured()) {
    const rows = await db.select().from(schema.githubConnections).where(eq(schema.githubConnections.userId, userId)).limit(1);
    return rows[0] ? githubClientFromEncrypted(rows[0].accessTokenEncrypted) : null;
  }
  const conn = store.githubConnections.get(userId);
  return conn ? githubClientFromEncrypted(conn.accessTokenEncrypted) : null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const sp = req.nextUrl.searchParams;
    const owner = sp.get("owner"), repo = sp.get("repo");
    if (!owner || !repo) return fail("owner and repo are required");
    const gh = await getClient(user.id);
    if (!gh) return fail("GitHub is not connected", 400);
    const branches = await gh.listBranches(owner, repo);
    return ok({ branches: branches.map((b: any) => ({ name: b.name, sha: b.commit?.sha })) });
  } catch (e) { return serverError(e); }
}

/** POST — create a branch: { owner, repo, branch, from } */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { owner, repo, branch, from } = await req.json();
    if (!owner || !repo || !branch) return fail("owner, repo and branch are required");
    const gh = await getClient(user.id);
    if (!gh) return fail("GitHub is not connected", 400);
    await gh.createBranch(owner, repo, branch, from ?? "main");
    return ok({ created: true, branch });
  } catch (e) { return serverError(e); }
}
