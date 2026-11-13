import { Topbar } from "@/components/layout/Topbar";
import { GithubView } from "@/features/github/GithubView";

export const dynamic = "force-dynamic";

export default function GithubPage() {
  return (
    <>
      <Topbar title="GitHub" />
      <GithubView />
    </>
  );
}
