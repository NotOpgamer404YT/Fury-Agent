"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FolderGit2, Bot, KeyRound, Github, Plus, ArrowRight, Activity, CheckCircle2, Cpu, Database } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

async function get<T>(path: string): Promise<T> {
  const r = await fetch(path);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "Request failed");
  return j.data;
}

export function DashboardView({ userName }: { userName: string }) {
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => get<{ projects: any[] }>("/api/v1/projects") });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => get<{ tasks: any[] }>("/api/v1/tasks?limit=10") });
  const providers = useQuery({ queryKey: ["providers"], queryFn: () => get<{ providers: any[]; encryptionConfigured: boolean }>("/api/v1/providers") });
  const repos = useQuery({ queryKey: ["gh-repos"], queryFn: () => get<{ connected: boolean; repositories: any[]; login?: string }>("/api/v1/github/repositories") });
  const usage = useQuery({ queryKey: ["usage"], queryFn: () => get<{ totals: { prompt: number; completion: number; calls: number }; byModel: any[] }>("/api/v1/usage") });

  const t = tasks.data?.tasks ?? [];
  const completed = t.filter((x) => x.status === "completed").length;
  const enabledProviders = (providers.data?.providers ?? []).filter((p) => p.enabled);

  const stats = [
    { label: "Projects", value: projects.data?.projects.length ?? 0, icon: FolderGit2, href: "/projects" },
    { label: "Agent tasks", value: t.length, icon: Bot, href: "/tasks" },
    { label: "Completed", value: completed, icon: CheckCircle2, href: "/tasks" },
    { label: "Model calls", value: usage.data?.totals.calls ?? 0, icon: Cpu, href: "/providers" },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <section className="rounded-2xl border border-border bg-gradient-to-br from-accent/20 via-card to-accent2/10 p-6">
        <h2 className="text-2xl font-bold">Welcome back, {userName}</h2>
        <p className="mt-1 text-sm text-muted">Your self-hosted agent workspace. Everything below is live data from your database and connected services.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/projects"><Button size="sm"><Plus className="h-4 w-4" /> New project</Button></Link>
          <Link href="/providers"><Button size="sm" variant="secondary"><KeyRound className="h-4 w-4" /> Connect AI provider</Button></Link>
          <Link href="/github"><Button size="sm" variant="secondary"><Github className="h-4 w-4" /> GitHub</Button></Link>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition hover:border-accent/50">
              <CardContent className="p-4">
                <s.icon className="mb-3 h-4 w-4 text-accent2" />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted">{s.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between"><CardTitle>Recent tasks</CardTitle>
            <Link href="/tasks" className="flex items-center gap-1 text-xs text-accent2">All tasks <ArrowRight className="h-3 w-3" /></Link></CardHeader>
          <CardContent className="space-y-2">
            {tasks.isLoading && <p className="text-sm text-muted">Loading…</p>}
            {t.length === 0 && !tasks.isLoading && <p className="text-sm text-muted">No tasks yet. Create a project, then start an agent task.</p>}
            {t.slice(0, 6).map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-panel p-3 transition hover:border-accent/40">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted">{new Date(task.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2"><Badge status={task.mode} /><Badge status={task.status} /></div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Provider status</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {enabledProviders.length === 0 && <p className="text-sm text-muted">No providers enabled. Add Gemini, Groq, OpenRouter or any OpenAI-compatible endpoint.</p>}
              {enabledProviders.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0"><p className="truncate">{p.name}</p><p className="truncate text-xs text-muted">{p.modelId}</p></div>
                  <Badge status={p.lastTestStatus === "ok" ? "enabled" : p.lastTestStatus === "failed" ? "failed" : "pending"} />
                </div>
              ))}
              {!providers.data?.encryptionConfigured && <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">ENCRYPTION_KEY is not set — API keys cannot be stored.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>GitHub</CardTitle></CardHeader>
            <CardContent>
              {repos.data?.connected ? (
                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2"><Activity className="h-4 w-4 text-emerald-400" /> Connected as <span className="font-mono">{repos.data.login}</span></p>
                  <p className="text-xs text-muted">{repos.data.repositories.length} repositories available</p>
                  <Link href="/github" className="mt-2 inline-flex items-center gap-1 text-xs text-accent2">Import a repo <ArrowRight className="h-3 w-3" /></Link>
                </div>
              ) : (
                <div className="text-sm text-muted">
                  <p className="flex items-center gap-2"><Database className="h-4 w-4" /> GitHub not connected</p>
                  <Link href="/github" className="mt-2 inline-flex items-center gap-1 text-xs text-accent2">Connect GitHub <ArrowRight className="h-3 w-3" /></Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Model usage</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div><p className="text-xl font-bold">{usage.data?.totals.calls ?? 0}</p><p className="text-xs text-muted">Total calls</p></div>
            <div><p className="text-xl font-bold">{usage.data?.totals.prompt ?? 0}</p><p className="text-xs text-muted">Prompt tokens</p></div>
            <div><p className="text-xl font-bold">{usage.data?.totals.completion ?? 0}</p><p className="text-xs text-muted">Completion tokens</p></div>
          </div>
          {(usage.data?.byModel.length ?? 0) > 0 && (
            <div className="mt-4 space-y-1">
              {usage.data!.byModel.map((m) => (
                <div key={m.model} className="flex justify-between text-xs text-muted"><span className="font-mono">{m.model}</span><span>{m.calls} calls</span></div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
