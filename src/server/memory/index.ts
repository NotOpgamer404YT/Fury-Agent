/**
 * Project memory — keeps agent context small and relevant.
 *
 * Sources: project instructions, stored memories (repo summary, task summaries),
 * recent messages. Nothing here clones a repository: files are fetched on demand
 * through tools, so the prompt only carries what the step needs.
 */
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq, desc } from "drizzle-orm";
import { store } from "@/lib/store";

export const MAX_INSTRUCTIONS = 4000;
export const MAX_MEMORIES = 6;
export const MAX_MEMORY_CHARS = 1200;

export async function loadProjectInstructions(projectId: string | null): Promise<string> {
  if (!projectId) return "";
  const db = getDb();
  if (db && isDbConfigured()) {
    const rows = await db.select({ instructions: schema.projects.instructions }).from(schema.projects).where(eq(schema.projects.id, projectId)).limit(1);
    return (rows[0]?.instructions ?? "").slice(0, MAX_INSTRUCTIONS);
  }
  return (store.projects.get(projectId)?.instructions ?? "").slice(0, MAX_INSTRUCTIONS);
}

export async function loadMemories(projectId: string | null): Promise<string[]> {
  if (!projectId) return [];
  const db = getDb();
  let rows: Array<{ kind: string; content: string }> = [];
  if (db && isDbConfigured()) {
    rows = await db.select({ kind: schema.projectMemories.kind, content: schema.projectMemories.content })
      .from(schema.projectMemories).where(eq(schema.projectMemories.projectId, projectId))
      .orderBy(desc(schema.projectMemories.createdAt)).limit(MAX_MEMORIES);
  } else {
    rows = store.memories.filter((m) => m.projectId === projectId).slice(-MAX_MEMORIES)
      .map((m) => ({ kind: String(m.kind), content: String(m.content) }));
  }
  return rows.map((r) => `${r.kind}: ${r.content.slice(0, MAX_MEMORY_CHARS)}`);
}

export async function saveMemory(projectId: string, kind: string, content: string): Promise<void> {
  const db = getDb();
  const trimmed = content.slice(0, MAX_MEMORY_CHARS);
  if (db && isDbConfigured()) {
    await db.insert(schema.projectMemories).values({ projectId, kind, content: trimmed });
    return;
  }
  store.memories.push({ id: store.id(), projectId, kind, content: trimmed, createdAt: store.now() });
}

/** Compact context block appended to the system prompt. */
export async function buildMemoryContext(projectId: string | null): Promise<string> {
  const [instructions, memories] = await Promise.all([loadProjectInstructions(projectId), loadMemories(projectId)]);
  const parts: string[] = [];
  if (instructions) parts.push(`Project instructions:\n${instructions}`);
  if (memories.length) parts.push(`Project memory:\n${memories.map((m) => `- ${m}`).join("\n")}`);
  return parts.join("\n\n");
}

/**
 * Cheap context compression: keep the most recent messages and clamp each one.
 * Avoids sending an entire repository or unbounded history to the model.
 */
export function compressHistory(messages: Array<{ role: string; content: string }>, maxMessages = 20, maxChars = 4000) {
  const recent = messages.slice(-maxMessages);
  return recent.map((m) => ({
    role: m.role === "tool" ? "user" : m.role,
    content: m.role === "tool" ? `Tool result:\n${m.content.slice(0, maxChars)}` : m.content.slice(0, maxChars),
  }));
}
