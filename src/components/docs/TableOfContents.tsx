import { slugify } from "@/lib/slug";

export function TableOfContents({ body }: { body: string }) {
  const headings = body
    .split("\n")
    .filter((l) => /^##\s+/.test(l))
    .map((l) => l.replace(/^##\s+/, "").trim());
  if (headings.length === 0) return null;
  return (
    <aside className="hidden w-56 shrink-0 xl:block">
      <div className="sticky top-24">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">On this page</p>
        <ul className="space-y-1.5 border-l border-border pl-3">
          {headings.map((h) => (
            <li key={h}><a href={`#${slugify(h)}`} className="text-xs text-muted hover:text-primary">{h}</a></li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
