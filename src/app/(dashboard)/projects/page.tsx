import { Topbar } from "@/components/layout/Topbar";
import { ProjectsView } from "@/features/projects/ProjectsView";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  return (
    <>
      <Topbar title="Projects" />
      <ProjectsView />
    </>
  );
}
