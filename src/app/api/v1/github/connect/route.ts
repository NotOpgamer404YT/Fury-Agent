import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { buildAuthorizeUrl } from "@/lib/github";
import { ok, fail } from "@/lib/api";
import { randomBytes } from "crypto";

/** Returns the GitHub OAuth authorize URL (state stored in a cookie). */
export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) return fail("GITHUB_CLIENT_ID is not configured on this instance", 400);
    const appUrl = process.env.APP_URL ?? req.nextUrl.origin;
    const state = randomBytes(16).toString("hex");
    const url = buildAuthorizeUrl(clientId, `${appUrl}/api/v1/github/callback`, state);
    const res = ok({ url });
    res.cookies.set("fury_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600, secure: process.env.NODE_ENV === "production" });
    return res;
  } catch (e: any) {
    return fail(e?.message === "Unauthorized" ? "Unauthorized" : "Failed to start GitHub connection", 401);
  }
}
