import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schema } from "./schema";

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

let _db: PostgresJsDatabase<typeof schema> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

/** Lazy DB singleton — safe during `next build` without DATABASE_URL. */
export function getDb(): PostgresJsDatabase<typeof schema> | null {
  if (!process.env.DATABASE_URL) return null;
  if (!_db) {
    _client = postgres(process.env.DATABASE_URL, { prepare: false, max: 5 });
    _db = drizzle(_client, { schema });
  }
  return _db;
}

export { schema };
