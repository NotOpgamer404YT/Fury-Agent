import { DocRenderer } from "@/components/docs/DocRenderer";
import { DocNav } from "@/components/docs/DocNav";
import { DOCS } from "@/lib/docs";
import { TableOfContents } from "@/components/docs/TableOfContents";

export const metadata = { title: "Documentation — Fury Agent" };

export default function DocsIndexPage() {
  const doc = DOCS[0];
  return (
    <div className="flex gap-8">
      <article className="min-w-0 flex-1">
        <p className="mb-1 text-xs uppercase tracking-wide text-accent2">Documentation</p>
        <DocRenderer body={doc.body} />
        <DocNav slug="" />
      </article>
      <TableOfContents body={doc.body} />
    </div>
  );
}
