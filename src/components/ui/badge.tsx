import * as React from "react";
import { cn } from "@/lib/utils";

const colors: Record<string, string> = {
  pending: "bg-slate-500/20 text-slate-300",
  planning: "bg-violet-500/20 text-violet-300",
  running: "bg-cyan-500/20 text-cyan-300",
  waiting_approval: "bg-amber-500/20 text-amber-300",
  reviewing: "bg-blue-500/20 text-blue-300",
  completed: "bg-emerald-500/20 text-emerald-300",
  failed: "bg-red-500/20 text-red-300",
  cancelled: "bg-slate-500/20 text-slate-400",
  ask: "bg-cyan-500/20 text-cyan-300",
  plan: "bg-violet-500/20 text-violet-300",
  agent: "bg-fuchsia-500/20 text-fuchsia-300",
  enabled: "bg-emerald-500/20 text-emerald-300",
  disabled: "bg-slate-500/20 text-slate-400",
};

export function Badge({ status, className }: { status: string; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", colors[status] ?? "bg-card text-muted", className)}>{status.replace("_", " ")}</span>;
}
