import { DocRenderer } from "@/components/docs/DocRenderer";
import { DocNav } from "@/components/docs/DocNav";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { getDoc } from "@/lib/docs";
import { notFound } from "next/navigation";

export const metadata = { title: "architecture — Fury Agent docs" };

export default function DocPageArchitecture() {
  const doc = getDoc("architecture");
  if (!doc) notFound();
  return (
    <div className="flex gap-8">
      <article className="min-w-0 flex-1">
        <DocRenderer body={doc.body} />
        <DocNav slug="architecture" />
      </article>
      <TableOfContents body={doc.body} />
    </div>
  );
}
