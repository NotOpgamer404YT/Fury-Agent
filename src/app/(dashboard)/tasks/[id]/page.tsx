import { Topbar } from "@/components/layout/Topbar";
import { TaskDetail } from "@/components/agent/TaskDetail";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Topbar title="Agent Task" />
      <TaskDetail taskId={id} />
    </>
  );
}
