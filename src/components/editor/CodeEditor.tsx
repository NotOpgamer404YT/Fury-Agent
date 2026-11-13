"use client";
import { useEffect, useRef } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { search, searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";

function langFor(path: string) {
  if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(path)) return javascript({ jsx: true, typescript: /tsx?$/.test(path) });
  if (/\.json$/.test(path)) return json();
  if (/\.(md|mdx)$/.test(path)) return markdown();
  return [];
}

export function CodeEditor({ value, path, fontSize = 13, onChange }: { value: string; path: string; fontSize?: number; onChange: (v: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!ref.current) return;
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(), highlightActiveLineGutter(), highlightActiveLine(), history(), drawSelection(),
        foldGutter(), bracketMatching(), indentOnInput(),
        search({ top: true }), highlightSelectionMatches(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
        langFor(path),
        EditorView.lineWrapping,
        EditorView.theme({
          "&": { backgroundColor: "#0B1220", color: "#E2E8F0", height: "100%" },
          ".cm-gutters": { backgroundColor: "#0B1220", color: "#475569", border: "none" },
          ".cm-activeLine": { backgroundColor: "#111a2e" },
          ".cm-activeLineGutter": { backgroundColor: "#111a2e" },
          ".cm-content": { fontFamily: "ui-monospace, SFMono-Regular, monospace" },
        }, { dark: true }),
        EditorView.updateListener.of((u) => { if (u.docChanged) onChangeRef.current(u.state.doc.toString()); }),
      ],
    });
    const view = new EditorView({ state, parent: ref.current });
    viewRef.current = view;
    return () => { view.destroy(); viewRef.current = null; };
  }, [path]);

  // Sync external value changes (e.g. switching back to a reverted buffer)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (view.state.doc.toString() !== value) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    }
  }, [value]);

  return <div ref={ref} className="h-full w-full overflow-hidden" style={{ fontSize }} />;
}

export const editorCompartment = new Compartment();
export type { EditorView };
