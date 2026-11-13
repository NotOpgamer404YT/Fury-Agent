"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bot, FolderGit2, KeyRound, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderGit2 },
  { href: "/tasks", label: "Agent", icon: Bot },
  { href: "/providers", label: "Models", icon: KeyRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-panel/95 backdrop-blur lg:hidden">
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link key={item.href} href={item.href}
            className={cn("flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]", active ? "text-accent2" : "text-muted")}>
            <item.icon className="h-5 w-5" /> {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
