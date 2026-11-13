"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/v1/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
    const j = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(j.error ?? "Registration failed"); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-black/30">
      <h1 className="text-xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-muted">Accounts live in your own PostgreSQL database.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-1.5"><Label htmlFor="name">Name</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" /></div>
        <div className="space-y-1.5"><Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
        <div className="space-y-1.5"><Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /></div>
        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating…" : "Create account"}</Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Already registered? <Link href="/login" className="text-accent2 hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
