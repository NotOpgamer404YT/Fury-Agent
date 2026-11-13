"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Search, Menu, X } from "lucide-react";
import { DOCS, docHref } from "@/lib/docs";
import { cn } from "@/lib/utils";

export function DocsSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const items = DOCS.filter((d) => (d.title + d.description + d.body).toLowerCase().includes(q.toLowerCase()));

  const nav = (
    <nav className="space-y-1">
      {items.map((d) => {
        const href = docHref(d.slug);
        const active = pathname === href;
        return (
          <Link key={href} href={href} onClick={() => setOpen(false)}
            className={cn("block rounded-lg px-3 py-2 text-sm transition", active ? "bg-accent/15 text-primary" : "text-muted hover:bg-card hover:text-primary")}>
            {d.title}
          </Link>
        );
      })}
      {items.length === 0 && <p className="px-3 py-2 text-xs text-muted">No matches</p>}
    </nav>
  );

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-medium text-white shadow-lg lg:hidden">
        <Menu className="h-4 w-4" /> Docs menu
      </button>
      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-border bg-panel p-4 transition-transform lg:sticky lg:top-[57px] lg:z-0 lg:block lg:h-[calc(100vh-57px)] lg:w-64 lg:shrink-0 lg:translate-x-0 lg:border-r-0 lg:bg-transparent lg:p-0",
        open ? "translate-x-0" : "-translate-x-full")}>
        <div className="mb-3 flex items-center justify-between lg:hidden">
          <span className="font-semibold">Documentation</span>
          <button onClick={() => setOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search docs…" className="w-full bg-transparent text-sm focus:outline-none" />
        </div>
        {nav}
        <div className="mt-6 rounded-xl border border-border bg-card p-3 text-xs text-muted">
          <p className="font-medium text-primary">Self-hosting?</p>
          <p className="mt-1">Start with Installation, then Configuration. Deployment covers Vercel + Neon.</p>
        </div>
      </aside>
    </>
  );
}
