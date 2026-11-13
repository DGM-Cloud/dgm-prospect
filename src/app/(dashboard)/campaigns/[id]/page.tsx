import { DashboardShell } from "@/shared/components/layout/dashboard-shell";
import { CampaignDetail } from "@/modules/campaigns/components/campaign-detail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <DashboardShell
      title="Detalle de campaña"
      breadcrumbs={["DGM Prospect", "Campañas", "Detalle"]}
    >
      <CampaignDetail campaignId={id} />
    </DashboardShell>
  );
}
