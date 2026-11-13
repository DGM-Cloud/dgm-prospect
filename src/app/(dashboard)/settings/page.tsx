import { DashboardShell } from "@/shared/components/layout/dashboard-shell";
import { ExportPanel } from "@/modules/reporting/components/export-panel";
import { isSupabaseConfigured } from "@/lib/env";

export default function SettingsPage() {
  const supabaseConfigured = isSupabaseConfigured();

  return (
    <DashboardShell
      title="Configuración"
      breadcrumbs={["DGM Prospect", "Configuración"]}
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-5 text-sm">
          <h2 className="font-semibold text-[var(--color-ink)]">Autenticación</h2>
          <p className="mt-2 text-[var(--color-muted-foreground)]">
            Supabase Auth:{" "}
            {supabaseConfigured ? "configurado" : "no configurado (modo local)"}
          </p>
          {!supabaseConfigured ? (
            <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
              Define NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY y
              SUPABASE_JWT_SECRET en .env para habilitar login real.
            </p>
          ) : null}
        </div>
        <ExportPanel />
      </div>
    </DashboardShell>
  );
}
