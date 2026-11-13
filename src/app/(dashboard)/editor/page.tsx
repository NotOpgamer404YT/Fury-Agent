import { Topbar } from "@/components/layout/Topbar";
import { EditorWorkspace } from "@/components/editor/EditorWorkspace";

export const dynamic = "force-dynamic";

export default function EditorPage() {
  return (
    <>
      <Topbar title="Code Editor" />
      <EditorWorkspace />
    </>
  );
}
