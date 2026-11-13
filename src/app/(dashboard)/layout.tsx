import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <div className="min-h-screen bg-ink">
      <Sidebar />
      <div className="lg:pl-64">
        <main className="min-h-screen pb-20 lg:pb-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
