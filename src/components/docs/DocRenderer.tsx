"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { CodeBlock } from "./CodeBlock";
import { slugify } from "@/lib/slug";

export function DocRenderer({ body }: { body: string }) {
  return (
    <div className="prose-fury min-w-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 id={slugify(String(children))} className="mb-4 mt-2 text-3xl font-bold">{children}</h1>,
          h2: ({ children }) => <h2 id={slugify(String(children))} className="mb-3 mt-9 scroll-mt-24 border-b border-border pb-2 text-xl font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 id={slugify(String(children))} className="mb-2 mt-6 scroll-mt-24 text-base font-semibold">{children}</h3>,
          p: ({ children }) => <p className="mb-3 text-sm leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="mb-4 list-disc space-y-1.5 pl-5 text-sm">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-sm">{children}</ol>,
          li: ({ children }) => <li className="text-slate-300">{children}</li>,
          a: ({ href, children }) => {
            const h = href ?? "#";
            if (h.startsWith("/")) return <Link href={h} className="text-accent2 underline-offset-2 hover:underline">{children}</Link>;
            return <a href={h} target="_blank" rel="noreferrer" className="text-accent2 underline-offset-2 hover:underline">{children}</a>;
          },
          code: ({ className, children, ...props }: any) => {
            const isBlock = typeof children === "string" && children.includes("\n");
            if (isBlock || className) {
              const lang = /language-(\w+)/.exec(className ?? "")?.[1];
              return <CodeBlock code={String(children).replace(/\n$/, "")} lang={lang} />;
            }
            return <code className="rounded bg-panel px-1.5 py-0.5 font-mono text-[0.85em] text-accent2" {...props}>{children}</code>;
          },
          pre: ({ children }) => <>{children}</>,
          table: ({ children }) => <div className="mb-4 overflow-x-auto rounded-xl border border-border"><table className="w-full text-sm">{children}</table></div>,
          thead: ({ children }) => <thead className="bg-panel text-left text-xs uppercase tracking-wide text-muted">{children}</thead>,
          th: ({ children }) => <th className="px-3 py-2 font-medium">{children}</th>,
          td: ({ children }) => <td className="border-t border-border px-3 py-2 align-top text-slate-300">{children}</td>,
          blockquote: ({ children }) => <blockquote className="my-4 border-l-2 border-accent bg-panel/60 px-4 py-2 text-sm text-slate-300">{children}</blockquote>,
          hr: () => <hr className="my-8 border-border" />,
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
