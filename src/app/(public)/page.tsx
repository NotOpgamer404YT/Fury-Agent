"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap, Github, ArrowRight, Bot, Code2, GitBranch, Shield, Server, Sparkles, Check, Lock, Layers,
} from "lucide-react";

const fade = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };

const features = [
  { icon: Bot, title: "Three agent modes", text: "Ask for explanations, plan risky work, then let Agent mode edit files, open branches and raise pull requests." },
  { icon: GitBranch, title: "Real GitHub integration", text: "Browse repos, read files, build blobs/trees/commits and open PRs — all through the GitHub APIs, no shell needed." },
  { icon: Code2, title: "CodeMirror editor", text: "Multi-tab editing with syntax highlighting, diff view and GitHub-backed saves." },
  { icon: Lock, title: "Your keys, encrypted", text: "Bring your own provider keys. AES-256-GCM at rest, never returned by the API, never logged." },
  { icon: Server, title: "Serverless by design", text: "Bounded agent steps, PostgreSQL checkpoints and resumable tasks. No VPS, no Docker, no daemons." },
  { icon: Shield, title: "MIT licensed & self-hosted", text: "Fork it, deploy it to your own Vercel account, and own every byte of the stack." },
];

const steps = [
  { n: "01", title: "Deploy to Vercel", text: "Clone the repo and import it. Add DATABASE_URL, AUTH_SECRET and ENCRYPTION_KEY." },
  { n: "02", title: "Connect providers", text: "Add Gemini, Groq, Cerebras, OpenRouter, FreeLLMAPI, OmniRoute or any OpenAI-compatible endpoint." },
  { n: "03", title: "Link GitHub & ship", text: "Authorize GitHub, import a repository, then run an agent task end to end." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.18),transparent_55%)]" />
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent2"><Zap className="h-5 w-5 text-white" /></span>
          <span className="text-lg font-bold">Fury Agent</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          <a href="#features" className="hover:text-primary">Features</a>
          <Link href="/docs" className="hover:text-primary">Docs</Link>
          <a href="#start" className="hover:text-primary">Get started</a>
          <a href="https://github.com/NotOpgamer404YT/Fury-Agent" className="hover:text-primary" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-xl px-3 py-2 text-sm text-muted hover:text-primary">Sign in</Link>
          <Link href="/register" className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90">Get started</Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-5">
        <section className="py-16 text-center md:py-24">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted">
            <Sparkles className="h-3.5 w-3.5 text-accent2" /> Open source · MIT · Self-hosted on your Vercel account
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            The AI coding agent you <span className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">actually own</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.6 }}
            className="mx-auto mt-5 max-w-2xl text-base text-muted md:text-lg">
            Fury Agent turns your own GitHub repositories into an agent workspace. Bring your own AI keys,
            run multi-step coding tasks with approvals, and merge real pull requests — all from a serverless Next.js app.
          </motion.p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 font-medium text-white transition hover:bg-accent/90 sm:w-auto">
              Start building <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="https://vercel.com/new/clone?repository-url=https://github.com/NotOpgamer404YT/Fury-Agent"
              target="_blank" rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-medium transition hover:bg-panel sm:w-auto">
              <svg viewBox="0 0 76 65" className="h-4 w-4 fill-current"><path d="M37.59.25l36.95 64H.64l36.95-64z" /></svg>
              Deploy to Vercel
            </a>
          </div>
          <p className="mt-4 text-xs text-muted">You deploy with your own database and secrets. No Fury accounts, no shared API keys.</p>
        </section>

        <motion.section {...fade} className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
            <span className="ml-3 truncate text-xs text-muted">fury-agent · agent task · feat/auth-callback</span>
          </div>
          <div className="grid gap-0 md:grid-cols-3">
            <div className="border-b border-border p-4 md:border-b-0 md:border-r">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Progress</p>
              {[
                ["Plan created", "done"], ["Read 6 files", "done"], ["Patch src/auth/session.ts", "waiting"], ["Open pull request", "todo"],
              ].map(([label, state]) => (
                <div key={label} className="mb-2 flex items-center gap-2 text-sm">
                  <span className={`h-1.5 w-1.5 rounded-full ${state === "done" ? "bg-emerald-400" : state === "waiting" ? "bg-amber-400" : "bg-slate-600"}`} />
                  <span className={state === "todo" ? "text-muted" : "text-primary"}>{label}</span>
                </div>
              ))}
            </div>
            <div className="p-4 md:col-span-2">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Diff preview</p>
              <pre className="overflow-x-auto rounded-xl bg-[#0B1220] p-3 text-[11px] leading-relaxed md:text-xs">
{`--- a/src/auth/session.ts
+++ b/src/auth/session.ts
@@ -12,6 +12,9 @@ export async function verify(token) {
-  return decode(token);
+  const payload = await decode(token);
+  if (!payload?.exp) throw new SessionError("missing exp");
+  return payload;
 }`}
              </pre>
            </div>
          </div>
        </motion.section>

        <section id="features" className="py-16 md:py-24">
          <motion.h2 {...fade} className="text-center text-3xl font-bold md:text-4xl">Everything an agent needs, nothing you can&apos;t audit</motion.h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted">Built for developers who want real repository execution with real permission boundaries.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <motion.div key={f.title} {...fade} className="rounded-2xl border border-border bg-card p-5 transition hover:border-accent/50">
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15"><f.icon className="h-5 w-5 text-accent" /></span>
                <h3 className="mb-1.5 font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="start" className="py-16 md:py-24">
          <motion.h2 {...fade} className="text-center text-3xl font-bold md:text-4xl">Live in under ten minutes</motion.h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <motion.div key={s.n} {...fade} className="rounded-2xl border border-border bg-panel p-6">
                <span className="text-sm font-mono text-accent2">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted">{s.text}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Layers className="mt-0.5 h-5 w-5 text-accent2" />
              <div>
                <p className="font-medium">Read the deployment guide</p>
                <p className="text-sm text-muted">Database, secrets, GitHub OAuth, provider setup and security hardening.</p>
              </div>
            </div>
            <Link href="/docs/deployment" className="flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/90">
              Open docs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="pb-20">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-accent/15 via-card to-accent2/10 p-8 text-center">
            <h2 className="text-2xl font-bold md:text-3xl">Own your agent stack</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted">MIT licensed. Fork it, brand it, extend the tool registry and deploy it wherever you like.</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="https://github.com/NotOpgamer404YT/Fury-Agent" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium hover:bg-panel">
                <Github className="h-4 w-4" /> Star on GitHub
              </a>
              <Link href="/docs/installation" className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white hover:bg-accent/90">
                <Check className="h-4 w-4" /> Installation guide
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted md:flex-row">
          <p>© {new Date().getFullYear()} Fury Agent · MIT License</p>
          <div className="flex gap-5">
            <Link href="/docs" className="hover:text-primary">Documentation</Link>
            <Link href="/docs/contributing" className="hover:text-primary">Contributing</Link>
            <a href="https://github.com/NotOpgamer404YT/Fury-Agent" className="hover:text-primary" target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
