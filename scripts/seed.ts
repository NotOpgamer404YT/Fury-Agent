/**
 * Optional seed script — creates a demo user in YOUR database.
 * Run: npm run seed
 * Requires DATABASE_URL, AUTH_SECRET (unused here) and ENCRYPTION_KEY (only if seeding a provider).
 * Never run this against a production database you care about without reading it first.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { schema } from "../src/lib/database/schema";

const DEMO_EMAIL = process.env.SEED_EMAIL ?? "demo@fury.local";
const DEMO_PASSWORD = process.env.SEED_PASSWORD ?? "fury-demo-password";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required. This seeds a real PostgreSQL database (not the dev memory store).");
    process.exit(1);
  }
  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });

  const existing = await db.select().from(schema.users).where(eq(schema.users.email, DEMO_EMAIL)).limit(1);
  if (existing[0]) {
    console.log(`User ${DEMO_EMAIL} already exists — nothing to do.`);
    await client.end();
    return;
  }
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const rows = await db.insert(schema.users).values({ name: "Demo Developer", email: DEMO_EMAIL, passwordHash }).returning();
  console.log(`Created demo user: ${DEMO_EMAIL} (id ${rows[0].id})`);
  console.log(`Password: ${DEMO_PASSWORD} — change it after signing in.`);
  console.log("Next: sign in, add an AI provider under /providers, then connect GitHub under /github.");
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
