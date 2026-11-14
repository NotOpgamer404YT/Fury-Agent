/**
 * Session primitives.
 *
 * The cookie carries an HS256 JWT containing the user id and a session id (`sid`).
 * The session id is what actually authorises the request: the row in `sessions`
 * must exist and must not be expired. That makes sessions revocable (logout,
 * account deletion) and keeps expiry authoritative in the database.
 */
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "crypto";

export const SESSION_COOKIE = "fury_session";
export const SESSION_DAYS = 7;

/** Local-dev only. This value is public (it ships in the repo), so production must never use it. */
const DEV_FALLBACK_SECRET = "dev-only-insecure-secret-change-me";

/**
 * Signing key for session cookies.
 *
 * Production fails closed: without AUTH_SECRET we throw instead of silently
 * signing cookies with a key that is published in this repository. Auth routes
 * surface that as a 500 with a message telling the operator what to set, which
 * is far better than a deployment that looks healthy but has forgeable sessions.
 */
export function resolveAuthSecret(raw: string | undefined, nodeEnv: string | undefined): string {
  if (raw) return raw;
  if (nodeEnv === "production") {
    throw new Error("AUTH_SECRET is not configured — set a 32-byte secret in your environment variables.");
  }
  return DEV_FALLBACK_SECRET;
}

/**
 * True when sessions can be signed safely. Development falls back to a local
 * key; production requires an explicit AUTH_SECRET.
 */
export function isAuthConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET) || process.env.NODE_ENV !== "production";
}

export function authSecret(): Uint8Array {
  // NODE_ENV is inlined at build time, so the decision itself lives in a pure helper.
  return new TextEncoder().encode(resolveAuthSecret(process.env.AUTH_SECRET, process.env.NODE_ENV));
}

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function signSessionJwt(userId: string, sessionId: string): Promise<string> {
  return new SignJWT({ sub: userId, sid: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(authSecret());
}

export async function readSessionJwt(): Promise<{ userId: string; sessionId: string } | null> {
  try {
    const jar = await cookies();
    const jwt = jar.get(SESSION_COOKIE)?.value;
    if (!jwt) return null;
    const { payload } = await jwtVerify(jwt, authSecret());
    const userId = typeof payload.sub === "string" ? payload.sub : "";
    const sessionId = typeof payload.sid === "string" ? payload.sid : "";
    if (!userId || !sessionId) return null;
    return { userId, sessionId };
  } catch {
    return null;
  }
}

export async function setSessionCookie(jwt: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 3600,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
