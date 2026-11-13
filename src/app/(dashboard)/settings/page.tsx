import { Topbar } from "@/components/layout/Topbar";
import { SettingsView } from "@/components/settings/SettingsView";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSessionUser();
  return (
    <>
      <Topbar title="Settings" />
      <SettingsView user={user!} />
    </>
  );
}
