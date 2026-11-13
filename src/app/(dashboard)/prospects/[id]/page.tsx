import { DashboardShell } from "@/shared/components/layout/dashboard-shell";
import { ProspectDetail } from "@/modules/prospects/components/prospect-detail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProspectDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <DashboardShell
      title="Detalle de prospecto"
      breadcrumbs={["DGM Prospect", "Prospectos", "Detalle"]}
    >
      <ProspectDetail prospectId={id} />
    </DashboardShell>
  );
}
