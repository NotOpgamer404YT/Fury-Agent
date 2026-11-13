import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  userAgent: text("user_agent"),
}, (t) => [index("sessions_user_idx").on(t.userId), index("sessions_expires_idx").on(t.expiresAt)]);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  githubRepoId: integer("github_repo_id"),
  owner: text("owner"),
  repo: text("repo"),
  defaultBranch: text("default_branch").notNull().default("main"),
  instructions: text("instructions"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("projects_user_idx").on(t.userId)]);

export const githubConnections = pgTable("github_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  githubUserId: integer("github_user_id"),
  login: text("login"),
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  scope: text("scope"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const repositories = pgTable("repositories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  githubRepoId: integer("github_repo_id").notNull(),
  owner: text("owner").notNull(),
  repo: text("repo").notNull(),
  defaultBranch: text("default_branch").notNull().default("main"),
  private: boolean("private").notNull().default(false),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("repos_user_github_idx").on(t.userId, t.githubRepoId)]);

export const providerConfigs = pgTable("provider_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  providerType: text("provider_type").notNull().default("openai-compatible"),
  baseUrl: text("base_url").notNull(),
  apiKeyEncrypted: text("api_key_encrypted"),
  modelId: text("model_id").notNull(),
  contextWindow: integer("context_window").notNull().default(128000),
  maxOutputTokens: integer("max_output_tokens").notNull().default(4096),
  supportsTools: boolean("supports_tools").notNull().default(false),
  supportsStreaming: boolean("supports_streaming").notNull().default(true),
  temperature: text("temperature").notNull().default("0.2"),
  timeoutMs: integer("timeout_ms").notNull().default(60000),
  priority: integer("priority").notNull().default(50),
  enabled: boolean("enabled").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  isCoding: boolean("is_coding").notNull().default(false),
  isPlanning: boolean("is_planning").notNull().default(false),
  isReview: boolean("is_review").notNull().default(false),
  lastTestedAt: timestamp("last_tested_at", { withTimezone: true }),
  lastTestStatus: text("last_test_status"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("providers_user_idx").on(t.userId)]);

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  mode: text("mode").notNull().default("ask"),
  status: text("status").notNull().default("pending"),
  providerId: uuid("provider_id").references(() => providerConfigs.id, { onDelete: "set null" }),
  modelId: text("model_id"),
  state: jsonb("state").notNull().default({}),
  stepCount: integer("step_count").notNull().default(0),
  maxSteps: integer("max_steps").notNull().default(25),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("tasks_user_idx").on(t.userId), index("tasks_status_idx").on(t.status)]);

export const taskEvents = pgTable("task_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("task_events_task_idx").on(t.taskId)]);

export const agentMessages = pgTable("agent_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  toolName: text("tool_name"),
  toolCallId: text("tool_call_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("agent_messages_task_idx").on(t.taskId)]);

export const toolExecutions = pgTable("tool_executions", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  toolName: text("tool_name").notNull(),
  input: jsonb("input"),
  output: jsonb("output"),
  status: text("status").notNull(),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("tool_executions_task_idx").on(t.taskId)]);

export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  toolName: text("tool_name").notNull(),
  input: jsonb("input"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
}, (t) => [index("approvals_task_idx").on(t.taskId)]);

export const projectMemories = pgTable("project_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("project_memories_project_idx").on(t.projectId)]);

export const modelUsage = pgTable("model_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  providerId: uuid("provider_id").references(() => providerConfigs.id, { onDelete: "set null" }),
  modelId: text("model_id").notNull(),
  promptTokens: integer("prompt_tokens").notNull().default(0),
  completionTokens: integer("completion_tokens").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("model_usage_user_idx").on(t.userId)]);

export const artifacts = pgTable("artifacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("artifacts_task_idx").on(t.taskId)]);

/** Namespace object so `import { schema }` works across the app. */
export const schema = {
  users, sessions, projects, githubConnections, repositories, providerConfigs,
  tasks, taskEvents, agentMessages, toolExecutions, approvals, projectMemories,
  modelUsage, artifacts,
};
