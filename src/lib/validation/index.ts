import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});
export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});
export const providerSchema = z.object({
  name: z.string().min(1).max(100),
  providerType: z.enum(["openai-compatible", "gemini", "freellmapi", "omniroute", "groq", "cerebras", "openrouter", "custom"]).default("openai-compatible"),
  baseUrl: z.string().url().max(500),
  apiKey: z.string().min(1).max(2000).optional(),
  modelId: z.string().min(1).max(200),
  contextWindow: z.number().int().min(1024).max(2000000).default(128000),
  maxOutputTokens: z.number().int().min(1).max(64000).default(4096),
  supportsTools: z.boolean().default(false),
  supportsStreaming: z.boolean().default(true),
  temperature: z.number().min(0).max(2).default(0.2),
  timeoutMs: z.number().int().min(5000).max(300000).default(60000),
  priority: z.number().int().min(0).max(100).default(50),
  enabled: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  isCoding: z.boolean().default(false),
  isPlanning: z.boolean().default(false),
  isReview: z.boolean().default(false),
});
export const projectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  githubRepoId: z.number().int().optional(),
  owner: z.string().max(100).optional(),
  repo: z.string().max(200).optional(),
  defaultBranch: z.string().max(100).default("main"),
  instructions: z.string().max(8000).optional(),
});
export const taskSchema = z.object({
  projectId: z.string().uuid().optional(),
  title: z.string().min(1).max(300),
  prompt: z.string().min(1).max(20000),
  mode: z.enum(["ask", "plan", "agent"]).default("ask"),
  providerId: z.string().uuid().optional(),
  modelId: z.string().max(200).optional(),
});
export const importSchema = z.object({
  repoId: z.number().int(),
  owner: z.string().min(1).max(100),
  repo: z.string().min(1).max(200),
  defaultBranch: z.string().max(100).default("main"),
});
export const toolInputSchema = z.object({
  path: z.string().max(1000).optional(),
  content: z.string().max(200000).optional(),
  query: z.string().max(500).optional(),
  branch: z.string().max(200).optional(),
  message: z.string().max(1000).optional(),
  title: z.string().max(300).optional(),
  body: z.string().max(20000).optional(),
  baseBranch: z.string().max(200).optional(),
});

/** Safe repo-relative path: no traversal, no absolute paths, no null bytes. */
export function assertSafePath(p: string): string {
  if (!p || p.includes("\0")) throw new Error("Invalid path");
  const norm = p.replace(/\\/g, "/").replace(/^\/+/, "");
  const parts = norm.split("/");
  if (parts.some((seg) => seg === ".." || seg === "")) throw new Error("Path traversal not allowed");
  if (norm.startsWith(".git/") || norm === ".git") throw new Error("Access to .git is not allowed");
  return norm;
}
