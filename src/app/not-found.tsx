import Link from "next/link";
import { Zap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent2"><Zap className="h-6 w-6 text-white" /></span>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="max-w-sm text-sm text-muted">That route does not exist in this Fury Agent instance.</p>
      <div className="flex gap-2">
        <Link href="/" className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white">Home</Link>
        <Link href="/docs" className="rounded-xl border border-border bg-card px-4 py-2 text-sm">Documentation</Link>
      </div>
    </div>
  );
}
