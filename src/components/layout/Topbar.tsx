"use client";
import { Menu, Search } from "lucide-react";
import { useAppStore } from "@/stores/app";
import { useState } from "react";

export function Topbar({ title }: { title: string }) {
  const { toggleSidebar } = useAppStore();
  const [q, setQ] = useState("");
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-ink/80 px-4 py-3 backdrop-blur lg:px-8">
      <button className="lg:hidden text-muted" onClick={toggleSidebar} aria-label="Open menu"><Menu className="h-6 w-6" /></button>
      <h1 className="text-base font-semibold text-primary lg:text-lg">{title}</h1>
      <div className="ml-auto hidden items-center gap-2 rounded-xl border border-border bg-panel px-3 py-2 md:flex">
        <Search className="h-4 w-4 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search docs…" className="w-40 bg-transparent text-sm text-primary placeholder:text-muted focus:outline-none" />
      </div>
    </header>
  );
}
