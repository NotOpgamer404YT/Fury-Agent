export const TASK_STATUSES = [
  "pending", "planning", "running", "waiting_approval", "reviewing", "completed", "failed", "cancelled",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TERMINAL_STATUSES: TaskStatus[] = ["completed", "failed", "cancelled"];

export function isTerminal(status: string): boolean {
  return TERMINAL_STATUSES.includes(status as TaskStatus);
}

export function canStep(status: string): boolean {
  return status === "pending" || status === "planning" || status === "running" || status === "reviewing";
}

export function canResume(status: string): boolean {
  return status === "failed" || status === "cancelled";
}

export function nextStatus(current: string): TaskStatus {
  switch (current) {
    case "pending": return "planning";
    case "planning": return "running";
    case "reviewing": return "completed";
    default: return current as TaskStatus;
  }
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  planning: "Planning",
  running: "Running",
  waiting_approval: "Waiting for approval",
  reviewing: "Reviewing",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};
