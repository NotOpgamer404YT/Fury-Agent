"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderGit2, Bot, KeyRound, Github, CheckSquare, Settings, BookOpen, Zap, LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderGit2 },
  { href: "/tasks", label: "Agent Tasks", icon: Bot },
  { href: "/providers", label: "AI Providers", icon: KeyRound },
  { href: "/github", label: "GitHub", icon: Github },
  { href: "/approvals", label: "Approvals", icon: CheckSquare },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/docs", label: "Documentation", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebar } = useAppStore();
  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebar(false)} />}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-panel transition-transform lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent2"><Zap className="h-5 w-5 text-white" /></span>
            <span className="text-lg font-bold text-primary">Fury Agent</span>
          </Link>
          <button className="lg:hidden text-muted" onClick={() => setSidebar(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebar(false)}
                className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors", active ? "bg-accent/15 text-primary" : "text-muted hover:bg-card hover:text-primary")}>
                <item.icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-card hover:text-primary"
            onClick={async () => { await fetch("/api/v1/auth/logout", { method: "POST" }); window.location.href = "/login"; }}>
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
