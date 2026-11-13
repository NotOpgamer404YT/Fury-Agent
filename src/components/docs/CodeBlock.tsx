"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="group relative my-4 overflow-hidden rounded-xl border border-border bg-[#0B1220]">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-[11px] uppercase tracking-wide text-muted">{lang ?? "shell"}</span>
        <button
          onClick={async () => { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="flex items-center gap-1 text-[11px] text-muted hover:text-primary" aria-label="Copy code">
          {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-slate-200"><code>{code}</code></pre>
    </div>
  );
}
