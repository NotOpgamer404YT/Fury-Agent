"use client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Github, Download, Lock, Unlock, Search, ExternalLink, Unplug } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

async function get<T>(path: string): Promise<T> {
  const r = await fetch(path);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "Request failed");
  return j.data;
}

export function GithubView() {
  const qc = useQueryClient();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [importing, setImporting] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const repos = useQuery({ queryKey: ["gh-repos"], queryFn: () => get<{ connected: boolean; login?: string; repositories: any[] }>("/api/v1/github/repositories") });

  useEffect(() => {
    if (params.get("connected")) setMessage("GitHub connected successfully.");
    if (params.get("error")) setMessage(`Connection failed: ${params.get("error")}`);
  }, [params]);

  async function connect() {
    const res = await fetch("/api/v1/github/connect", { method: "POST" });
    const j = await res.json().catch(() => ({}));
    if (j.data?.url) window.location.href = j.data.url;
    else setMessage(j.error ?? "GitHub OAuth is not configured (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET).");
  }

  async function importRepo(r: any) {
    setImporting(r.id); setMessage("");
    const res = await fetch("/api/v1/github/import", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoId: r.id, owner: r.owner, repo: r.name, defaultBranch: r.defaultBranch }),
    });
    const j = await res.json().catch(() => ({}));
    setImporting(null);
    if (!res.ok) { setMessage(j.error ?? "Import failed"); return; }
    setMessage(`Imported ${r.fullName} as project "${j.data.project.name}".`);
    qc.invalidateQueries({ queryKey: ["projects"] });
  }

  async function disconnect() {
    if (!confirm("Disconnect GitHub? Imported projects will keep their metadata but lose repository access.")) return;
    await fetch("/api/v1/github/repositories", { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["gh-repos"] });
  }

  const filtered = (repos.data?.repositories ?? []).filter((r) => r.fullName.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4 p-4 md:p-6 lg:p-8">
      {message && <p className="rounded-xl border border-border bg-panel px-3 py-2 text-sm text-muted">{message}</p>}

      {!repos.data?.connected ? (
        <Card><CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <Github className="h-9 w-9 text-accent" />
          <p className="text-lg font-semibold">Connect your GitHub account</p>
          <p className="max-w-md text-sm text-muted">
            Fury Agent uses OAuth with the minimum scopes (<code className="font-mono">repo read:user</code>) to read your repositories,
            create branches, commit through the Git Database API and open pull requests. Your token is encrypted at rest and never sent to the AI model.
          </p>
          <Button onClick={connect}><Github className="h-4 w-4" /> Connect GitHub</Button>
          <p className="text-xs text-muted">Requires GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your environment (see /docs/github).</p>
        </CardContent></Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">Connected as <span className="font-mono text-primary">{repos.data.login}</span> · {repos.data.repositories.length} repositories</p>
            <Button variant="outline" size="sm" onClick={disconnect}><Unplug className="h-4 w-4" /> Disconnect</Button>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-panel px-3 py-2">
            <Search className="h-4 w-4 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter repositories…" className="w-full bg-transparent text-sm focus:outline-none" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.slice(0, 60).map((r) => (
              <Card key={r.id}>
                <CardHeader className="flex-row items-start justify-between">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2 truncate text-sm">
                      {r.private ? <Lock className="h-3.5 w-3.5 text-amber-400" /> : <Unlock className="h-3.5 w-3.5 text-emerald-400" />}
                      {r.fullName}
                    </CardTitle>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{r.description || "No description"}</p>
                  </div>
                  <a href={`https://github.com/${r.fullName}`} target="_blank" rel="noreferrer" aria-label="Open on GitHub"><ExternalLink className="h-4 w-4 text-muted hover:text-primary" /></a>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-card px-2 py-0.5 text-[11px] text-muted">{r.defaultBranch}</span>
                  {r.language && <span className="rounded bg-card px-2 py-0.5 text-[11px] text-muted">{r.language}</span>}
                  <div className="ml-auto flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => importRepo(r)} disabled={importing === r.id}>
                      <Download className="h-3.5 w-3.5" /> {importing === r.id ? "Importing…" : "Import"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { window.location.href = `/editor?owner=${r.owner}&repo=${r.name}&branch=${r.defaultBranch}`; }}>Editor</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
      <Input className="hidden" readOnly value="" />
    </div>
  );
}
