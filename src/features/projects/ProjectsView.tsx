"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, FolderGit2, Trash2, Github, ArrowRight, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select } from "@/components/ui/input";

async function get<T>(path: string): Promise<T> {
  const r = await fetch(path);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "Request failed");
  return j.data;
}

export function ProjectsView() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", owner: "", repo: "", defaultBranch: "main", instructions: "" });
  const [error, setError] = useState("");
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => get<{ projects: any[] }>("/api/v1/projects") });
  const repos = useQuery({ queryKey: ["gh-repos"], queryFn: () => get<{ connected: boolean; repositories: any[] }>("/api/v1/github/repositories") });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/v1/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setError(j.error ?? "Create failed"); return; }
    setOpen(false); setForm({ name: "", description: "", owner: "", repo: "", defaultBranch: "main", instructions: "" });
    qc.invalidateQueries({ queryKey: ["projects"] });
  }

  async function remove(id: string) {
    if (!confirm("Delete this project? Tasks will keep their history.")) return;
    await fetch(`/api/v1/projects/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["projects"] });
  }

  return (
    <div className="space-y-4 p-4 md:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">A project links a repository to agent tasks and instructions.</p>
        <div className="flex gap-2">
          <Link href="/github"><Button variant="secondary"><Github className="h-4 w-4" /> Import from GitHub</Button></Link>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New project</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(projects.data?.projects ?? []).map((p) => (
          <Card key={p.id} className="transition hover:border-accent/40">
            <CardContent className="space-y-2 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2"><FolderGit2 className="h-4 w-4 text-accent2" /><p className="font-medium">{p.name}</p></div>
                <button onClick={() => remove(p.id)} aria-label="Delete project"><Trash2 className="h-4 w-4 text-muted hover:text-red-400" /></button>
              </div>
              <p className="line-clamp-2 text-xs text-muted">{p.description || "No description"}</p>
              {p.owner && p.repo && <p className="font-mono text-xs text-muted">{p.owner}/{p.repo} · {p.defaultBranch}</p>}
              <div className="flex gap-2 pt-1">
                <Link href={`/tasks?projectId=${p.id}`} className="text-xs text-accent2">Start task →</Link>
                <Link href={`/editor?owner=${p.owner}&repo=${p.repo}&branch=${p.defaultBranch}`} className="text-xs text-accent2">Editor →</Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.data?.projects.length === 0 && (
        <Card><CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <FolderGit2 className="h-8 w-8 text-accent" />
          <p className="font-medium">No projects yet</p>
          <p className="max-w-md text-sm text-muted">Import a repository from GitHub to create a project with real file access, or create one manually with owner/repo details.</p>
          <div className="flex gap-2">
            <Link href="/github"><Button variant="secondary"><Github className="h-4 w-4" /> Connect GitHub</Button></Link>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New project</Button>
          </div>
        </CardContent></Card>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-t-2xl border border-border bg-card p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">New project</h2>
              <Button size="icon" variant="ghost" onClick={() => setOpen(false)}><X className="h-5 w-5" /></Button></div>
            <form onSubmit={save} className="space-y-3">
              <div className="space-y-1"><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="my-app" /></div>
              <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this project is about" /></div>
              {repos.data?.connected && (
                <div className="space-y-1"><Label>Pick a connected repository (optional)</Label>
                  <Select onChange={(e) => {
                    const r = repos.data!.repositories.find((x) => x.fullName === e.target.value);
                    if (r) setForm({ ...form, owner: r.owner, repo: r.name, defaultBranch: r.defaultBranch, name: form.name || r.fullName });
                  }}>
                    <option value="">— manual entry —</option>
                    {repos.data.repositories.map((r) => <option key={r.id} value={r.fullName}>{r.fullName}</option>)}
                  </Select></div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1"><Label>Owner</Label><Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="octocat" /></div>
                <div className="space-y-1"><Label>Repo</Label><Input value={form.repo} onChange={(e) => setForm({ ...form, repo: e.target.value })} placeholder="repo" /></div>
                <div className="space-y-1"><Label>Branch</Label><Input value={form.defaultBranch} onChange={(e) => setForm({ ...form, defaultBranch: e.target.value })} /></div>
              </div>
              <div className="space-y-1"><Label>Project instructions (sent to the agent)</Label>
                <Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="Conventions, stack notes, do-not-touch areas…" /></div>
              {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
              <div className="flex gap-2"><Button type="submit" className="flex-1">Create project</Button><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button></div>
            </form>
          </div>
        </div>
      )}
      <span className="hidden"><ArrowRight /></span>
    </div>
  );
}
