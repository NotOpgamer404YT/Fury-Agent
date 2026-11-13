import { Topbar } from "@/components/layout/Topbar";
import { ProvidersView } from "@/features/providers/ProvidersView";

export const dynamic = "force-dynamic";

export default function ProvidersPage() {
  return (
    <>
      <Topbar title="AI Providers" />
      <ProvidersView />
    </>
  );
}
