/**
 * Agent tool registry. Every tool has: description, input schema,
 * permission rules, execution, error handling, audit history.
 * File tools operate through the GitHub API (serverless-safe).
 * No shell execution is claimed unless an ExecutionProvider is connected.
 */
import { z } from "zod";
import { assertSafePath } from "@/lib/validation";
import type { GitHubClient } from "@/lib/github";

export type ToolContext = {
  owner: string | null;
  repo: string | null;
  branch: string;
  github: GitHubClient | null;
  mode: "ask" | "plan" | "agent";
};

export type ToolDef = {
  name: string;
  description: string;
  schema: z.ZodTypeAny;
  requires: "read" | "write" | "git";
  needsApproval: boolean;
  execute: (ctx: ToolContext, args: any) => Promise<unknown>;
};

function needRepo(ctx: ToolContext): { owner: string; repo: string } {
  if (!ctx.github || !ctx.owner || !ctx.repo) throw new Error("No GitHub repository connected to this project. Connect GitHub and import a repository first.");
  return { owner: ctx.owner, repo: ctx.repo };
}

export const TOOLS: ToolDef[] = [
  {
    name: "list_files", description: "List files in a repository directory (recursive tree, capped).", requires: "read", needsApproval: false,
    schema: z.object({ path: z.string().optional() }),
    async execute(ctx, args) {
      const { owner, repo } = needRepo(ctx);
      const tree = await ctx.github!.listTree(owner, repo, ctx.branch);
      let items = tree.tree.filter((t: any) => t.type === "blob").map((t: any) => t.path);
      if (args.path) { const p = assertSafePath(args.path); items = items.filter((x: string) => x === p || x.startsWith(p + "/")); }
      return { files: items.slice(0, 500), truncated: items.length > 500 };
    },
  },
  {
    name: "read_file", description: "Read a file from the repository.", requires: "read", needsApproval: false,
    schema: z.object({ path: z.string().min(1) }),
    async execute(ctx, args) {
      const { owner, repo } = needRepo(ctx);
      const content = await ctx.github!.getFileContent(owner, repo, assertSafePath(args.path), ctx.branch);
      return { path: args.path, content: content.slice(0, 100000) };
    },
  },
  {
    name: "search_files", description: "Search repository code via GitHub code search.", requires: "read", needsApproval: false,
    schema: z.object({ query: z.string().min(1).max(500) }),
    async execute(ctx, args) {
      const { owner, repo } = needRepo(ctx);
      const r = await ctx.github!.searchCode(owner, repo, args.query);
      return { total: r.total_count, items: (r.items ?? []).map((i: any) => ({ path: i.path, url: i.html_url })).slice(0, 30) };
    },
  },
  {
    name: "create_file", description: "Create a new file in the repository (committed to the task branch).", requires: "write", needsApproval: true,
    schema: z.object({ path: z.string().min(1), content: z.string().max(200000) }),
    async execute(ctx, args) {
      const { owner, repo } = needRepo(ctx);
      const sha = await ctx.github!.commitFiles(owner, repo, ctx.branch, [{ path: assertSafePath(args.path), content: args.content }], `Create ${args.path}`);
      return { path: args.path, commit: sha };
    },
  },
  {
    name: "edit_file", description: "Create or replace a file's contents in the repository.", requires: "write", needsApproval: true,
    schema: z.object({ path: z.string().min(1), content: z.string().max(200000) }),
    async execute(ctx, args) {
      const { owner, repo } = needRepo(ctx);
      const sha = await ctx.github!.commitFiles(owner, repo, ctx.branch, [{ path: assertSafePath(args.path), content: args.content }], `Edit ${args.path}`);
      return { path: args.path, commit: sha };
    },
  },
  {
    name: "delete_file", description: "Delete a file by committing an empty tree entry removal (via tree without the path is not supported by Git Database API alone; implemented as commit with file emptied + note). Use edit_file to remove content; true deletion requires a tree rebuild.", requires: "write", needsApproval: true,
    schema: z.object({ path: z.string().min(1) }),
    async execute(ctx, args) {
      const { owner, repo } = needRepo(ctx);
      // Honest implementation: GitHub Git Database API deletes by omitting the path
      // from a new tree built on the base tree. We achieve this by committing a tree
      // that excludes the path via the commitFiles path with a tombstone marker is NOT
      // deletion — so we perform a proper tree rebuild here.
      const baseSha = await ctx.github!.getCommitSha(owner, repo, ctx.branch);
      const baseCommit: any = await (ctx.github as any).req(`/repos/${owner}/${repo}/git/commits/${baseSha}`);
      const fullTree: any = await (ctx.github as any).req(`/repos/${owner}/${repo}/git/trees/${baseCommit.tree.sha}?recursive=1`);
      const keep = (fullTree.tree ?? []).filter((t: any) => t.path !== assertSafePath(args.path));
      const newTree: any = await (ctx.github as any).req(`/repos/${owner}/${repo}/git/trees`, { method: "POST", body: JSON.stringify({ tree: keep }) });
      const commit: any = await (ctx.github as any).req(`/repos/${owner}/${repo}/git/commits`, { method: "POST", body: JSON.stringify({ message: `Delete ${args.path}`, tree: newTree.sha, parents: [baseSha] }) });
      await (ctx.github as any).req(`/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(ctx.branch)}`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha }) });
      return { path: args.path, commit: commit.sha };
    },
  },
  {
    name: "generate_patch", description: "Generate a unified diff preview between two file contents (no commit).", requires: "read", needsApproval: false,
    schema: z.object({ path: z.string().min(1), before: z.string().max(200000), after: z.string().max(200000) }),
    async execute(_ctx, args) {
      const a = args.before.split("\n"), b = args.after.split("\n");
      const lines: string[] = [`--- a/${args.path}`, `+++ b/${args.path}`];
      const max = Math.max(a.length, b.length);
      for (let i = 0; i < max; i++) {
        if (a[i] === b[i]) lines.push(" " + (a[i] ?? ""));
        else { if (a[i] !== undefined) lines.push("-" + a[i]); if (b[i] !== undefined) lines.push("+" + b[i]); }
      }
      return { patch: lines.join("\n").slice(0, 50000) };
    },
  },
  {
    name: "inspect_package_json", description: "Read and summarize package.json (scripts, deps).", requires: "read", needsApproval: false,
    schema: z.object({}),
    async execute(ctx) {
      const { owner, repo } = needRepo(ctx);
      const raw = await ctx.github!.getFileContent(owner, repo, "package.json", ctx.branch);
      const j = JSON.parse(raw);
      return { name: j.name, scripts: j.scripts ?? {}, dependencies: Object.keys(j.dependencies ?? {}), devDependencies: Object.keys(j.devDependencies ?? {}) };
    },
  },
  {
    name: "inspect_requirements", description: "Read requirements.txt / pyproject.toml if present.", requires: "read", needsApproval: false,
    schema: z.object({}),
    async execute(ctx) {
      const { owner, repo } = needRepo(ctx);
      const out: Record<string, string> = {};
      for (const f of ["requirements.txt", "pyproject.toml"]) {
        try { out[f] = (await ctx.github!.getFileContent(owner, repo, f, ctx.branch)).slice(0, 20000); } catch { /* absent */ }
      }
      if (!Object.keys(out).length) throw new Error("No requirements.txt or pyproject.toml found");
      return out;
    },
  },
  {
    name: "git_status", description: "Show repository metadata and current branch info.", requires: "git", needsApproval: false,
    schema: z.object({}),
    async execute(ctx) {
      const { owner, repo } = needRepo(ctx);
      const info = await ctx.github!.getRepo(owner, repo);
      const branches = await ctx.github!.listBranches(owner, repo);
      return { repo: info.full_name, defaultBranch: info.default_branch, currentBranch: ctx.branch, branches: branches.map((b: any) => b.name).slice(0, 50) };
    },
  },
  {
    name: "git_diff", description: "Show diff between base branch and current branch.", requires: "git", needsApproval: false,
    schema: z.object({ baseBranch: z.string().optional() }),
    async execute(ctx, args) {
      const { owner, repo } = needRepo(ctx);
      const cmp = await ctx.github!.compare(owner, repo, args.baseBranch ?? "main", ctx.branch);
      return { ahead: cmp.ahead_by, behind: cmp.behind_by, files: (cmp.files ?? []).map((f: any) => f.filename), patch: (cmp.files ?? []).map((f: any) => f.patch ?? "").join("\n").slice(0, 50000) };
    },
  },
  {
    name: "create_branch", description: "Create a new branch from the default branch.", requires: "git", needsApproval: true,
    schema: z.object({ branch: z.string().min(1).max(200) }),
    async execute(ctx, args) {
      const { owner, repo } = needRepo(ctx);
      await ctx.github!.createBranch(owner, repo, args.branch, ctx.branch);
      return { branch: args.branch };
    },
  },
  {
    name: "create_commit", description: "Commit staged file changes (creates a commit on the task branch).", requires: "git", needsApproval: true,
    schema: z.object({ files: z.array(z.object({ path: z.string(), content: z.string().max(200000) })).min(1).max(50), message: z.string().min(1).max(1000) }),
    async execute(ctx, args) {
      const { owner, repo } = needRepo(ctx);
      const sha = await ctx.github!.commitFiles(owner, repo, ctx.branch, args.files.map((f: any) => ({ path: assertSafePath(f.path), content: f.content })), args.message);
      return { commit: sha, message: args.message };
    },
  },
  {
    name: "create_pull_request", description: "Open a pull request from the task branch to the base branch.", requires: "git", needsApproval: true,
    schema: z.object({ title: z.string().min(1).max(300), body: z.string().max(20000).optional(), baseBranch: z.string().optional() }),
    async execute(ctx, args) {
      const { owner, repo } = needRepo(ctx);
      const pr = await ctx.github!.createPullRequest(owner, repo, args.title, args.body ?? "", ctx.branch, args.baseBranch ?? "main");
      return { number: pr.number, url: pr.html_url };
    },
  },
];

export function getTool(name: string): ToolDef | undefined {
  return TOOLS.find((t) => t.name === name);
}

/** Permission rules by mode. ASK/PLAN are read-only. */
export function isToolAllowed(tool: ToolDef, mode: "ask" | "plan" | "agent"): boolean {
  if (mode === "agent") return true;
  return tool.requires === "read";
}

export function toolDefinitionsForModel(mode: "ask" | "plan" | "agent") {
  return TOOLS.filter((t) => isToolAllowed(t, mode)).map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: zodToJsonSchema(t.schema) },
  }));
}

function zodToJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  // Minimal conversion: use Zod's shape when available, else empty object.
  const s: any = schema;
  if (s?.shape) {
    const properties: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(s.shape)) {
      const t = (v as any)?._def?.typeName ?? "";
      properties[k] = { type: t.includes("String") ? "string" : t.includes("Number") ? "number" : t.includes("Boolean") ? "boolean" : t.includes("Array") ? "array" : "string" };
    }
    return { type: "object", properties };
  }
  return { type: "object", properties: {} };
}

/**
 * Future ExecutionProvider interface — optional external execution services
 * (e.g. test runners) can be plugged in without rewriting the agent engine.
 * Disabled by default; no shell execution is claimed without one.
 */
export interface ExecutionProvider {
  id: string;
  runTests(ctx: ToolContext): Promise<{ executed: boolean; summary: string; details?: unknown }>;
}
export const executionProviders: ExecutionProvider[] = [];
