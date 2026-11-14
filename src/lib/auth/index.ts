import bcrypt from "bcryptjs";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { and, eq, lt } from "drizzle-orm";
import { store, findUserByEmail } from "@/lib/store";
import {
  SESSION_COOKIE, SESSION_DAYS, authSecret, newSessionToken, hashToken,
  signSessionJwt, readSessionJwt, setSessionCookie, clearSessionCookie,
} from "./session";

export { SESSION_COOKIE, hashToken };

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 12);
}
export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export type SessionUser = { id: string; name: string; email: string };

/** Create a session row, then bind it into a signed cookie. */
export async function createSession(userId: string, userAgent?: string): Promise<string> {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  const db = getDb();
  let sessionId: string;

  if (db && isDbConfigured()) {
    const rows = await db.insert(schema.sessions).values({
      userId, tokenHash: hashToken(token), expiresAt, userAgent: userAgent ?? null,
    }).returning({ id: schema.sessions.id });
    sessionId = rows[0].id;
    // opportunistic cleanup of expired rows
    await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date())).catch(() => {});
  } else {
    sessionId = store.id();
    store.sessions.set(sessionId, { id: sessionId, userId, tokenHash: hashToken(token), expiresAt, createdAt: store.now() });
  }

  await setSessionCookie(await signSessionJwt(userId, sessionId));
  return token;
}

/** Delete the current session row (server-side revocation) and clear the cookie. */
export async function destroySession(): Promise<void> {
  const current = await readSessionJwt();
  if (current) {
    const db = getDb();
    if (db && isDbConfigured()) {
      await db.delete(schema.sessions).where(eq(schema.sessions.id, current.sessionId)).catch(() => {});
    } else {
      store.sessions.delete(current.sessionId);
    }
  }
  await clearSessionCookie();
}

/**
 * Resolve the session user, enforcing DB expiry.
 * Only JWT verification failures are treated as "no session" (handled in
 * readSessionJwt). Unexpected failures — including dynamic-rendering errors —
 * propagate instead of silently looking like a logout.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const current = await readSessionJwt();
  if (!current) return null;
  const db = getDb();

  if (db && isDbConfigured()) {
    const rows = await db.select().from(schema.sessions)
      .where(and(eq(schema.sessions.id, current.sessionId), eq(schema.sessions.userId, current.userId)))
      .limit(1);
    const session = rows[0];
    if (!session || session.expiresAt.getTime() < Date.now()) return null;
    const users = await db.select().from(schema.users).where(eq(schema.users.id, current.userId)).limit(1);
    const u = users[0];
    return u ? { id: u.id, name: u.name, email: u.email } : null;
  }

  const session = store.sessions.get(current.sessionId);
  if (!session || session.userId !== current.userId) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    store.sessions.delete(current.sessionId);
    return null;
  }
  const u = store.users.get(current.userId);
  return u ? { id: u.id, name: u.name, email: u.email } : null;
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new Error("Unauthorized");
  return u;
}

export async function registerUser(name: string, email: string, password: string): Promise<SessionUser> {
  const db = getDb();
  const passwordHash = await hashPassword(password);
  if (db && isDbConfigured()) {
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (existing.length) throw new Error("Email already registered");
    const rows = await db.insert(schema.users).values({ name, email, passwordHash }).returning();
    const u = rows[0];
    return { id: u.id, name: u.name, email: u.email };
  }
  if (findUserByEmail(email)) throw new Error("Email already registered");
  const id = store.id();
  store.users.set(id, { id, name, email, passwordHash, createdAt: store.now(), updatedAt: store.now() });
  return { id, name, email };
}

export async function loginUser(email: string, password: string): Promise<SessionUser> {
  const db = getDb();
  if (db && isDbConfigured()) {
    const rows = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    const u = rows[0];
    if (!u || !(await verifyPassword(password, u.passwordHash))) throw new Error("Invalid email or password");
    return { id: u.id, name: u.name, email: u.email };
  }
  const u = findUserByEmail(email);
  if (!u || !(await verifyPassword(password, u.passwordHash))) throw new Error("Invalid email or password");
  return { id: u.id, name: u.name, email: u.email };
}

export async function deleteUser(userId: string): Promise<void> {
  const db = getDb();
  if (db && isDbConfigured()) {
    await db.delete(schema.users).where(eq(schema.users.id, userId));
    return;
  }
  store.users.delete(userId);
  for (const [k, v] of store.sessions) if (v.userId === userId) store.sessions.delete(k);
}

export { authSecret };
