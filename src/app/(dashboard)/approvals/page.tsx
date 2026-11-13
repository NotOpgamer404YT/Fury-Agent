import { Topbar } from "@/components/layout/Topbar";
import { ApprovalsView } from "@/features/tasks/ApprovalsView";

export const dynamic = "force-dynamic";

export default function ApprovalsPage() {
  return (
    <>
      <Topbar title="Approvals" />
      <ApprovalsView />
    </>
  );
}
