import { DashboardShell } from "@/shared/components/layout/dashboard-shell";
import { ExplorerWorkspace } from "@/modules/discovery/components/explorer-workspace";

export default function ExplorerPage() {
  return (
    <DashboardShell
      title="Business Explorer"
      breadcrumbs={["DGM Prospect", "Business Explorer"]}
    >
      <ExplorerWorkspace />
    </DashboardShell>
  );
}
