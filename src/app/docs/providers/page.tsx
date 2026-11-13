import { DocRenderer } from "@/components/docs/DocRenderer";
import { DocNav } from "@/components/docs/DocNav";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { getDoc } from "@/lib/docs";
import { notFound } from "next/navigation";

export const metadata = { title: "providers — Fury Agent docs" };

export default function DocPageProviders() {
  const doc = getDoc("providers");
  if (!doc) notFound();
  return (
    <div className="flex gap-8">
      <article className="min-w-0 flex-1">
        <DocRenderer body={doc.body} />
        <DocNav slug="providers" />
      </article>
      <TableOfContents body={doc.body} />
    </div>
  );
}
