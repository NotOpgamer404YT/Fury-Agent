/**
 * In-memory dev store — used ONLY when DATABASE_URL is not configured
 * (local development / preview). Production deployments must set
 * DATABASE_URL (Neon/Supabase) and run migrations; then PostgreSQL is
 * the source of truth and this store is unused.
 */
import { randomUUID } from "crypto";

export type Row = Record<string, any>;

class MemoryStore {
  users = new Map<string, Row>();
  sessions = new Map<string, Row>();
  providers = new Map<string, Row>();
  projects = new Map<string, Row>();
  tasks = new Map<string, Row>();
  taskEvents: Row[] = [];
  agentMessages: Row[] = [];
  toolExecutions: Row[] = [];
  approvals = new Map<string, Row>();
  modelUsage: Row[] = [];
  githubConnections = new Map<string, Row>(); // keyed by userId
  repositories = new Map<string, Row>();
  memories: Row[] = [];
  artifacts: Row[] = [];

  id() { return randomUUID(); }
  now() { return new Date(); }
}

export const store = new MemoryStore();

export function findUserByEmail(email: string): Row | undefined {
  for (const u of store.users.values()) if (u.email === email) return u;
  return undefined;
}
