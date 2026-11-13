"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const j = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(j.error ?? "Login failed"); return; }
    router.push(params.get("next") ?? "/dashboard");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-black/30">
      <h1 className="text-xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Sign in to your self-hosted Fury Agent instance.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-1.5"><Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
        <div className="space-y-1.5"><Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></div>
        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        No account? <Link href="/register" className="text-accent2 hover:underline">Create one</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
