import { DashboardShell } from "@/shared/components/layout/dashboard-shell";
import { PipelineWorkspace } from "@/modules/pipeline/components/pipeline-workspace";

export default function PipelinePage() {
  return (
    <DashboardShell
      title="Pipeline comercial"
      breadcrumbs={["DGM Prospect", "Pipeline"]}
    >
      <PipelineWorkspace />
    </DashboardShell>
  );
}
