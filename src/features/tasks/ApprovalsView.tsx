"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function get<T>(path: string): Promise<T> {
  const r = await fetch(path);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "Request failed");
  return j.data;
}

export function ApprovalsView() {
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => get<{ tasks: any[] }>("/api/v1/tasks") });
  const waiting = (tasks.data?.tasks ?? []).filter((t) => t.status === "waiting_approval");
  return (
    <div className="space-y-3 p-4 md:p-6 lg:p-8">
      <p className="text-sm text-muted">Write operations pause here for explicit approval. Nothing is committed to your repository without it unless auto-approve is enabled on the task.</p>
      {waiting.length === 0 && (
        <Card><CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <ShieldCheck className="h-8 w-8 text-accent" />
          <p className="font-medium">No pending approvals</p>
          <p className="text-sm text-muted">Agent tasks that need write access will appear here.</p>
        </CardContent></Card>
      )}
      {waiting.map((t) => (
        <Link key={t.id} href={`/tasks/${t.id}`}>
          <Card className="hover:border-amber-400/40">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.title}</p>
                <p className="truncate font-mono text-xs text-muted">pending tool: {t.state?.pendingTool?.name ?? "unknown"}</p>
              </div>
              <div className="flex shrink-0 gap-2"><Badge status={t.mode} /><Badge status={t.status} /></div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
