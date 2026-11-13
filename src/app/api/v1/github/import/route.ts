import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { importSchema } from "@/lib/validation";
import { getDb, isDbConfigured } from "@/lib/database";
import { schema } from "@/lib/database/schema";
import { eq, and } from "drizzle-orm";
import { store } from "@/lib/store";
import { ok, fail, serverError } from "@/lib/api";

/** Import a repo: creates a project + repository record for the user. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = importSchema.parse(await req.json());
    const db = getDb();
    if (db && isDbConfigured()) {
      const projects = await db.insert(schema.projects).values({
        userId: user.id, name: `${body.owner}/${body.repo}`, description: `Imported from GitHub`,
        githubRepoId: body.repoId, owner: body.owner, repo: body.repo, defaultBranch: body.defaultBranch,
      }).returning();
      const project = projects[0];
      const existing = await db.select().from(schema.repositories).where(and(eq(schema.repositories.userId, user.id), eq(schema.repositories.githubRepoId, body.repoId))).limit(1);
      if (!existing[0]) {
        await db.insert(schema.repositories).values({ userId: user.id, githubRepoId: body.repoId, owner: body.owner, repo: body.repo, defaultBranch: body.defaultBranch, projectId: project.id });
      }
      return ok({ project }, { status: 201 });
    }
    const projectId = store.id();
    const project = { id: projectId, userId: user.id, name: `${body.owner}/${body.repo}`, description: "Imported from GitHub", githubRepoId: body.repoId, owner: body.owner, repo: body.repo, defaultBranch: body.defaultBranch, createdAt: store.now(), updatedAt: store.now() };
    store.projects.set(projectId, project);
    const repoId = store.id();
    store.repositories.set(repoId, { id: repoId, userId: user.id, githubRepoId: body.repoId, owner: body.owner, repo: body.repo, defaultBranch: body.defaultBranch, projectId, createdAt: store.now() });
    return ok({ project }, { status: 201 });
  } catch (e) { return serverError(e); }
}

void fail;
