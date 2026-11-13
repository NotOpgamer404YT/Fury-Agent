import { Topbar } from "@/components/layout/Topbar";
import { DashboardView } from "@/components/projects/DashboardView";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  return (
    <>
      <Topbar title="Dashboard" />
      <DashboardView userName={user?.name ?? "developer"} />
    </>
  );
}
