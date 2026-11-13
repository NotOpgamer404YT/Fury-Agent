import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import { store } from "@/lib/store";
import { ok, fail, serverError } from "@/lib/api";
import { githubClientFromEncrypted } from "@/lib/github";
import { assertSafePath } from "@/lib/validation";

export const maxDuration = 30;

async function getClient(userId: string) {
  const db = getDb();
  if (db && isDbConfigured()) {
    const rows = await db.select().from(schema.githubConnections).where(eq(schema.githubConnections.userId, userId)).limit(1);
    if (!rows[0]) return null;
    return githubClientFromEncrypted(rows[0].accessTokenEncrypted);
  }
  const conn = store.githubConnections.get(userId);
  return conn ? githubClientFromEncrypted(conn.accessTokenEncrypted) : null;
}

/** GET /api/v1/github/files?owner=&repo=&branch=&path=  → file content
 *  GET /api/v1/github/files?owner=&repo=&branch=&tree=1 → file list */
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const sp = req.nextUrl.searchParams;
    const owner = sp.get("owner"), repo = sp.get("repo"), branch = sp.get("branch") ?? "main";
    if (!owner || !repo) return fail("owner and repo are required");
    const gh = await getClient(user.id);
    if (!gh) return fail("GitHub is not connected", 400);

    if (sp.get("tree") === "1") {
      const tree = await gh.listTree(owner, repo, branch);
      const files = tree.tree.filter((t: any) => t.type === "blob").map((t: any) => ({ path: t.path, size: t.size })).slice(0, 2000);
      return ok({ files, truncated: tree.truncated });
    }
    const path = assertSafePath(sp.get("path") ?? "");
    const content = await gh.getFileContent(owner, repo, path, branch);
    return ok({ path, content, branch });
  } catch (e) { return serverError(e); }
}

/** PUT /api/v1/github/files — save a file via a commit (one file, one commit). */
export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { owner, repo, branch, path, content, message } = body;
    if (!owner || !repo || !path) return fail("owner, repo and path are required");
    if (typeof content !== "string" || content.length > 200000) return fail("Invalid content");
    const safePath = assertSafePath(path);
    const gh = await getClient(user.id);
    if (!gh) return fail("GitHub is not connected", 400);
    const sha = await gh.commitFiles(owner, repo, branch ?? "main", [{ path: safePath, content }], message ?? `Update ${safePath} via Fury Agent`);
    return ok({ saved: true, commit: sha, path: safePath });
  } catch (e) { return serverError(e); }
}
