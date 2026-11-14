import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SystemBanner } from "@/components/layout/SystemBanner";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

// Every dashboard route is per-user: never prerender or cache it.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <div className="min-h-screen bg-ink">
      <Sidebar />
      <div className="lg:pl-64">
        <SystemBanner />
        <main className="min-h-screen pb-20 lg:pb-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
