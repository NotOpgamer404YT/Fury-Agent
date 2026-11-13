"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { FileCode, Folder, Save, X, AlertTriangle, Plus, GitCompare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CodeEditor } from "./CodeEditor";

type Tab = { path: string; content: string; original: string; dirty: boolean };

export function EditorWorkspace() {
  const params = useSearchParams();
  const owner = params.get("owner") ?? "";
  const repo = params.get("repo") ?? "";
  const [branch, setBranch] = useState(params.get("branch") ?? "main");
  const [files, setFiles] = useState<{ path: string; size: number }[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [fontSize, setFontSize] = useState(13);
  const [showDiff, setShowDiff] = useState(false);
  const [newPath, setNewPath] = useState("");
  const [committing, setCommitting] = useState(false);

  const q = useMemo(() => new URLSearchParams({ owner, repo, branch }).toString(), [owner, repo, branch]);

  useEffect(() => {
    if (!owner || !repo) return;
    setLoading(true);
    fetch(`/api/v1/github/files?${q}&tree=1`)
      .then((r) => r.json())
      .then((j) => { if (j.data?.files) setFiles(j.data.files); else setMessage(j.error ?? "Could not load files"); })
      .catch(() => setMessage("Could not load repository files"))
      .finally(() => setLoading(false));
  }, [q, owner, repo]);

  async function openFile(path: string) {
    if (tabs.find((t) => t.path === path)) { setActive(path); return; }
    const res = await fetch(`/api/v1/github/files?${q}&path=${encodeURIComponent(path)}`);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setMessage(j.error ?? "Could not read file"); return; }
    const content = j.data.content ?? "";
    setTabs((t) => [...t, { path, content, original: content, dirty: false }]);
    setActive(path);
  }

  function update(path: string, content: string) {
    setTabs((t) => t.map((x) => (x.path === path ? { ...x, content, dirty: content !== x.original } : x)));
  }

  function closeTab(path: string) {
    const tab = tabs.find((t) => t.path === path);
    if (tab?.dirty && !confirm(`Discard unsaved changes to ${path}?`)) return;
    setTabs((t) => t.filter((x) => x.path !== path));
    if (active === path) setActive(tabs.find((t) => t.path !== path)?.path ?? null);
  }

  function closeAll() {
    if (tabs.some((t) => t.dirty) && !confirm("Close all tabs and discard unsaved changes?")) return;
    setTabs([]); setActive(null);
  }

  async function save(commit: boolean) {
    const tab = tabs.find((t) => t.path === active);
    if (!tab) return;
    setCommitting(true); setMessage("");
    const res = await fetch("/api/v1/github/files", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner, repo, branch, path: tab.path, content: tab.content, message: commit ? `Update ${tab.path} via Fury Agent` : undefined }),
    });
    const j = await res.json().catch(() => ({}));
    setCommitting(false);
    if (!res.ok) { setMessage(j.error ?? "Save failed"); return; }
    setTabs((t) => t.map((x) => (x.path === tab.path ? { ...x, original: x.content, dirty: false } : x)));
    setMessage(`Committed ${tab.path} → ${branch} (${j.data.commit?.slice(0, 7)})`);
  }

  function createFile() {
    if (!newPath.trim()) return;
    if (tabs.find((t) => t.path === newPath)) { setActive(newPath); return; }
    setTabs((t) => [...t, { path: newPath, content: "", original: "", dirty: true }]);
    setActive(newPath); setNewPath("");
  }

  useEffect(() => {
    function beforeUnload(e: BeforeUnloadEvent) {
      if (tabs.some((t) => t.dirty)) { e.preventDefault(); e.returnValue = ""; }
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [tabs]);

  const activeTab = tabs.find((t) => t.path === active);

  if (!owner || !repo) {
    return <div className="p-6 text-sm text-muted">Open the editor from a project or the GitHub page so a repository can be loaded.</div>;
  }

  const filteredFiles = files.filter((f) => f.path.toLowerCase().includes(filter.toLowerCase())).slice(0, 400);

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <span className="truncate font-mono text-xs text-muted">{owner}/{repo}</span>
        <Input value={branch} onChange={(e) => setBranch(e.target.value)} className="h-8 w-32 text-xs" aria-label="Branch" />
        <Button size="sm" variant="ghost" onClick={() => setShowDiff((s) => !s)}><GitCompare className="h-4 w-4" /> {showDiff ? "Hide diff" : "Diff"}</Button>
        <div className="ml-auto flex items-center gap-1 text-xs text-muted">
          <span>Font</span>
          <button onClick={() => setFontSize((f) => Math.max(10, f - 1))} className="rounded border border-border px-2">−</button>
          <span>{fontSize}</span>
          <button onClick={() => setFontSize((f) => Math.min(20, f + 1))} className="rounded border border-border px-2">+</button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border md:flex">
          <div className="border-b border-border p-2">
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter files…" className="h-8 text-xs" />
          </div>
          <div className="border-b border-border p-2">
            <div className="flex gap-1">
              <Input value={newPath} onChange={(e) => setNewPath(e.target.value)} placeholder="new/file.ts" className="h-8 text-xs" />
              <Button size="icon" variant="ghost" onClick={createFile} aria-label="Create file"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {loading && <p className="px-3 py-2 text-xs text-muted">Loading tree…</p>}
            {filteredFiles.map((f) => (
              <button key={f.path} onClick={() => openFile(f.path)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-muted hover:bg-card hover:text-primary">
                <FileCode className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{f.path}</span>
              </button>
            ))}
            {!loading && filteredFiles.length === 0 && <p className="px-3 py-2 text-xs text-muted">No files. Check the branch name or GitHub connection.</p>}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-2">
            {tabs.map((t) => (
              <div key={t.path} className={`flex shrink-0 items-center gap-1 rounded-t-lg px-2 py-1.5 text-xs ${active === t.path ? "bg-panel text-primary" : "text-muted"}`}>
                <button onClick={() => setActive(t.path)} className="flex items-center gap-1">
                  {t.dirty && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}{t.path.split("/").pop()}
                </button>
                <button onClick={() => closeTab(t.path)} aria-label="Close tab"><X className="h-3 w-3" /></button>
              </div>
            ))}
            {tabs.length > 1 && <button onClick={closeAll} className="ml-1 text-[11px] text-muted hover:text-primary">close all</button>}
          </div>

          {message && <p className="flex items-center gap-2 border-b border-border bg-panel px-3 py-1.5 text-xs text-muted"><AlertTriangle className="h-3 w-3 shrink-0" />{message}</p>}

          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <div className="min-h-[40vh] flex-1 md:min-h-0">
              {activeTab ? (
                <CodeEditor value={activeTab.content} path={activeTab.path} fontSize={fontSize} onChange={(v) => update(activeTab.path, v)} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted">
                  <Folder className="h-8 w-8" />
                  <p>Select a file to edit. Changes commit through the GitHub API.</p>
                </div>
              )}
            </div>
            {showDiff && activeTab && (
              <div className="max-h-72 overflow-auto border-t border-border bg-[#0B1220] p-3 md:max-h-none md:w-1/2 md:border-l md:border-t-0">
                <p className="mb-2 text-xs font-semibold uppercase text-muted">Unsaved diff · {activeTab.path}</p>
                <pre className="whitespace-pre-wrap break-words text-[11px]">
                  {simpleDiff(activeTab.original, activeTab.content)}
                </pre>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-border px-3 py-2">
            {activeTab?.dirty && <span className="flex items-center gap-1 text-xs text-amber-300"><AlertTriangle className="h-3 w-3" /> Unsaved changes</span>}
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => save(false)} disabled={!activeTab || committing}>
                {committing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Commit file
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function simpleDiff(a: string, b: string) {
  const al = a.split("\n"), bl = b.split("\n");
  const out: React.ReactNode[] = [];
  const max = Math.max(al.length, bl.length);
  for (let i = 0; i < max; i++) {
    if (al[i] === bl[i]) continue;
    if (al[i] !== undefined) out.push(<span key={`-${i}`} className="block text-red-400">- {al[i]}</span>);
    if (bl[i] !== undefined) out.push(<span key={`+${i}`} className="block text-emerald-400">+ {bl[i]}</span>);
  }
  return out.length ? out : <span className="text-muted">No changes</span>;
}

void dynamic;
