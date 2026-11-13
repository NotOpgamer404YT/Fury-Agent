/** Shared API types. Kept dependency-free so both client and server can import them. */

export type ApiEnvelope<T> = { data: T };
export type ApiError = { error: string };

export type TaskStatus =
  | "pending" | "planning" | "running" | "waiting_approval"
  | "reviewing" | "completed" | "failed" | "cancelled";

export type AgentMode = "ask" | "plan" | "agent";

export type ProviderSummary = {
  id: string;
  name: string;
  providerType: string;
  baseUrl: string;
  modelId: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsTools: boolean;
  supportsStreaming: boolean;
  temperature: string;
  timeoutMs: number;
  priority: number;
  enabled: boolean;
  isDefault: boolean;
  isCoding: boolean;
  isPlanning: boolean;
  isReview: boolean;
  hasApiKey: boolean;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
};

export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  owner: string | null;
  repo: string | null;
  defaultBranch: string;
  instructions: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskSummary = {
  id: string;
  title: string;
  prompt: string;
  mode: AgentMode;
  status: TaskStatus;
  stepCount: number;
  maxSteps: number;
  modelId: string | null;
  state: Record<string, unknown>;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskEventDto = { id: string; taskId: string; type: string; message: string; createdAt: string };
export type AgentMessageDto = { id: string; taskId: string; role: string; content: string; toolName: string | null; createdAt: string };
