import { DashboardShell } from "@/shared/components/layout/dashboard-shell";
import { ProspectsWorkspace } from "@/modules/prospects/components/prospects-workspace";

export default function ProspectsPage() {
  return (
    <DashboardShell title="Prospectos" breadcrumbs={["DGM Prospect", "Prospectos"]}>
      <ProspectsWorkspace />
    </DashboardShell>
  );
}
