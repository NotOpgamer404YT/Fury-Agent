"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Trash2, Shield, KeyRound, Github, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function SettingsView({ user }: { user: { id: string; name: string; email: string } }) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  async function deleteAccount() {
    if (confirmText !== "DELETE") return;
    setBusy(true);
    await fetch("/api/v1/me", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="grid gap-4 p-4 md:p-6 lg:grid-cols-2 lg:p-8">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-4 w-4" /> Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1"><Label>Name</Label><Input value={user.name} readOnly /></div>
          <div className="space-y-1"><Label>Email</Label><Input value={user.email} readOnly /></div>
          <p className="text-xs text-muted">Accounts and sessions are stored in your own PostgreSQL database. Password reset is not enabled — use the database or re-register.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> AI credentials</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted">
          <p>Provider API keys are managed per provider and encrypted with AES-256-GCM using your server&apos;s <code className="font-mono">ENCRYPTION_KEY</code>.</p>
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="secondary" onClick={() => router.push("/providers")}>Manage providers</Button>
            <Button size="sm" variant="ghost" onClick={() => router.push("/github")}><Github className="h-4 w-4" /> GitHub</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4" /> Security</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted">
          <p>Sessions expire automatically after 7 days and are validated server-side on every request.</p>
          <a href="/docs/security" className="inline-flex items-center gap-1 text-xs text-accent2">Security documentation <ExternalLink className="h-3 w-3" /></a>
        </CardContent>
      </Card>

      <Card className="border-red-500/30">
        <CardHeader><CardTitle className="flex items-center gap-2 text-red-300"><Trash2 className="h-4 w-4" /> Delete account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted">This permanently deletes your account, projects, tasks, provider configs and GitHub connection. Type <span className="font-mono text-red-300">DELETE</span> to confirm.</p>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
          <Button variant="destructive" disabled={confirmText !== "DELETE" || busy} onClick={deleteAccount}>{busy ? "Deleting…" : "Delete my account"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
