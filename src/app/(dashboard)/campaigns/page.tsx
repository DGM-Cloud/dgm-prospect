import { DashboardShell } from "@/shared/components/layout/dashboard-shell";
import { CampaignsWorkspace } from "@/modules/campaigns/components/campaigns-workspace";

export default function CampaignsPage() {
  return (
    <DashboardShell title="Campañas" breadcrumbs={["DGM Prospect", "Campañas"]}>
      <CampaignsWorkspace />
    </DashboardShell>
  );
}
