import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { exchangeCodeForToken, GitHubClient } from "@/lib/github";
import { encrypt } from "@/lib/encryption";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { store } from "@/lib/store";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const appUrl = process.env.APP_URL ?? req.nextUrl.origin;
  try {
    const user = await getSessionUser();
    if (!user) return Response.redirect(`${appUrl}/login`);

    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const cookieState = req.cookies.get("fury_oauth_state")?.value;
    if (!code || !state || state !== cookieState) return Response.redirect(`${appUrl}/github?error=state_mismatch`);

    const clientId = process.env.GITHUB_CLIENT_ID!;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET!;
    const token = await exchangeCodeForToken(clientId, clientSecret, code, `${appUrl}/api/v1/github/callback`);

    const gh = new GitHubClient(token);
    const me = await gh.me();
    const encrypted = encrypt(token);

    const db = getDb();
    if (db && isDbConfigured()) {
      const existing = await db.select().from(schema.githubConnections).where(eq(schema.githubConnections.userId, user.id)).limit(1);
      if (existing[0]) {
        await db.update(schema.githubConnections).set({ accessTokenEncrypted: encrypted, githubUserId: me.id, login: me.login, updatedAt: new Date() }).where(eq(schema.githubConnections.userId, user.id));
      } else {
        await db.insert(schema.githubConnections).values({ userId: user.id, githubUserId: me.id, login: me.login, accessTokenEncrypted: encrypted, scope: "repo read:user" });
      }
    } else {
      store.githubConnections.set(user.id, { id: store.id(), userId: user.id, githubUserId: me.id, login: me.login, accessTokenEncrypted: encrypted, createdAt: store.now() });
    }
    return Response.redirect(`${appUrl}/github?connected=1`);
  } catch (e: any) {
    return Response.redirect(`${appUrl}/github?error=${encodeURIComponent(e?.message ?? "connect_failed")}`);
  }
}
