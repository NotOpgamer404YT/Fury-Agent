import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { projectSchema } from "@/lib/validation";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq, desc } from "drizzle-orm";
import { store } from "@/lib/store";
import { ok, serverError } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const db = getDb();
    if (db && isDbConfigured()) {
      const rows = await db.select().from(schema.projects).where(eq(schema.projects.userId, user.id)).orderBy(desc(schema.projects.updatedAt));
      return ok({ projects: rows });
    }
    const rows = [...store.projects.values()].filter((p) => p.userId === user.id);
    return ok({ projects: rows });
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = projectSchema.parse(await req.json());
    const db = getDb();
    if (db && isDbConfigured()) {
      const rows = await db.insert(schema.projects).values({
        userId: user.id, name: body.name, description: body.description ?? null,
        githubRepoId: body.githubRepoId ?? null, owner: body.owner ?? null, repo: body.repo ?? null,
        defaultBranch: body.defaultBranch, instructions: body.instructions ?? null,
      }).returning();
      return ok({ project: rows[0] }, { status: 201 });
    }
    const id = store.id();
    const project = { id, userId: user.id, ...body, createdAt: store.now(), updatedAt: store.now() };
    store.projects.set(id, project);
    return ok({ project }, { status: 201 });
  } catch (e) { return serverError(e); }
}
