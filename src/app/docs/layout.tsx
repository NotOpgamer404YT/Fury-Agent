import Link from "next/link";
import { Zap, Github, ArrowLeft } from "lucide-react";
import { DocsSidebar } from "@/components/docs/DocsSidebar";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-30 border-b border-border bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent2"><Zap className="h-4 w-4 text-white" /></span>
            <span className="font-bold">Fury Agent</span>
            <span className="rounded bg-card px-2 py-0.5 text-[10px] text-muted">docs</span>
          </Link>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <Link href="/dashboard" className="hidden text-muted hover:text-primary sm:block">Dashboard</Link>
            <a href="https://github.com/NotOpgamer404YT/Fury-Agent" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-muted hover:text-primary">
              <Github className="h-4 w-4" /> <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6">
        <DocsSidebar />
        <div className="min-w-0 flex-1 pb-20">{children}</div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-10">
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary"><ArrowLeft className="h-3 w-3" /> Back to home</Link>
      </div>
    </div>
  );
}
