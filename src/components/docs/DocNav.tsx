import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DOCS, docHref } from "@/lib/docs";

export function DocNav({ slug }: { slug: string }) {
  const i = DOCS.findIndex((d) => d.slug === slug);
  const prev = i > 0 ? DOCS[i - 1] : null;
  const next = i >= 0 && i < DOCS.length - 1 ? DOCS[i + 1] : null;
  return (
    <div className="mt-12 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
      {prev ? (
        <Link href={docHref(prev.slug)} className="rounded-xl border border-border bg-card p-4 transition hover:border-accent/40">
          <span className="flex items-center gap-1 text-xs text-muted"><ArrowLeft className="h-3 w-3" /> Previous</span>
          <p className="mt-1 text-sm font-medium">{prev.title}</p>
        </Link>
      ) : <span />}
      {next && (
        <Link href={docHref(next.slug)} className="rounded-xl border border-border bg-card p-4 text-right transition hover:border-accent/40 sm:col-start-2">
          <span className="flex items-center justify-end gap-1 text-xs text-muted">Next <ArrowRight className="h-3 w-3" /></span>
          <p className="mt-1 text-sm font-medium">{next.title}</p>
        </Link>
      )}
    </div>
  );
}
