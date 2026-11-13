import { DashboardShell } from "@/shared/components/layout/dashboard-shell";
import { DashboardWorkspace } from "@/modules/analytics/components/dashboard-workspace";
import { ExportPanel } from "@/modules/reporting/components/export-panel";

export default function DashboardPage() {
  return (
    <DashboardShell title="Dashboard" breadcrumbs={["DGM Prospect", "Dashboard"]}>
      <div className="space-y-6">
        <DashboardWorkspace />
        <ExportPanel />
      </div>
    </DashboardShell>
  );
}
