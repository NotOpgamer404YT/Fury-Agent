import { DocRenderer } from "@/components/docs/DocRenderer";
import { DocNav } from "@/components/docs/DocNav";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { getDoc } from "@/lib/docs";
import { notFound } from "next/navigation";

export const metadata = { title: "contributing — Fury Agent docs" };

export default function DocPageContributing() {
  const doc = getDoc("contributing");
  if (!doc) notFound();
  return (
    <div className="flex gap-8">
      <article className="min-w-0 flex-1">
        <DocRenderer body={doc.body} />
        <DocNav slug="contributing" />
      </article>
      <TableOfContents body={doc.body} />
    </div>
  );
}
