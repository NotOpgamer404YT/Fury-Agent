import { Topbar } from "@/components/layout/Topbar";
import { TasksView } from "@/features/tasks/TasksView";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await getSessionUser();
  return (
    <>
      <Topbar title="Agent Tasks" />
      <TasksView userName={user?.name ?? ""} />
    </>
  );
}
