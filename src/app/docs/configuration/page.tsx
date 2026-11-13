import { DocRenderer } from "@/components/docs/DocRenderer";
import { DocNav } from "@/components/docs/DocNav";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { getDoc } from "@/lib/docs";
import { notFound } from "next/navigation";

export const metadata = { title: "configuration — Fury Agent docs" };

export default function DocPageConfiguration() {
  const doc = getDoc("configuration");
  if (!doc) notFound();
  return (
    <div className="flex gap-8">
      <article className="min-w-0 flex-1">
        <DocRenderer body={doc.body} />
        <DocNav slug="configuration" />
      </article>
      <TableOfContents body={doc.body} />
    </div>
  );
}
