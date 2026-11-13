"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/shared/components/empty-state";

type DashboardMetrics = {
  totalProspects: number;
  pendingProspects: number;
  qualifiedProspects: number;
  openOpportunities: number;
  proposalOpportunities: number;
  convertedClients: number;
  activeCampaigns: number;
  totalAnalyses: number;
  prospectsByStatus: Record<string, number>;
  opportunitiesByStage: Record<string, number>;
  recentProspects: Array<{
    id: string;
    businessName: string;
    status: string;
    category: string | null;
    createdAt: string;
  }>;
  generatedAt: string;
};

const CARDS: Array<{
  key: keyof DashboardMetrics;
  label: string;
  hint: string;
}> = [
  {
    key: "totalProspects",
    label: "Total de prospectos",
    hint: "Cartera comercial registrada",
  },
  {
    key: "pendingProspects",
    label: "Prospectos pendientes",
    hint: "DISCOVERED + TO_REVIEW + CONTACT_PENDING",
  },
  {
    key: "qualifiedProspects",
    label: "Prospectos calificados",
    hint: "Estado QUALIFIED",
  },
  {
    key: "openOpportunities",
    label: "Oportunidades abiertas",
    hint: "Etapas abiertas del pipeline",
  },
  {
    key: "proposalOpportunities",
    label: "Propuestas comerciales",
    hint: "Oportunidades en etapa PROPOSAL",
  },
  {
    key: "convertedClients",
    label: "Clientes convertidos",
    hint: "Prospectos en estado WON",
  },
];

async function fetchMetrics() {
  const response = await fetch("/api/v1/analytics/dashboard");
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "No se pudieron cargar las métricas");
  }
  return payload.data as DashboardMetrics;
}

export function DashboardWorkspace() {
  const query = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: fetchMetrics,
  });

  if (query.isLoading) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-white p-8 text-sm text-[var(--color-muted-foreground)]">
        Cargando indicadores reales…
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {query.error instanceof Error
          ? query.error.message
          : "Error al cargar el dashboard"}
      </div>
    );
  }

  const metrics = query.data!;
  const isEmpty = metrics.totalProspects === 0 && metrics.openOpportunities === 0;

  if (isEmpty) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Sin indicadores todavía"
        description="Cuando existan prospectos y oportunidades en la base de datos, aquí verás totales reales. No se muestran métricas inventadas."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((card) => {
          const value = metrics[card.key];
          return (
            <div
              key={card.key}
              className="rounded-lg border border-[var(--color-border)] bg-white p-5"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">
                {typeof value === "number" ? value : "—"}
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                {card.hint}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">
            Prospectos por estado
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {Object.keys(metrics.prospectsByStatus).length === 0 ? (
              <li className="text-[var(--color-muted-foreground)]">Sin datos</li>
            ) : (
              Object.entries(metrics.prospectsByStatus).map(([status, count]) => (
                <li
                  key={status}
                  className="flex items-center justify-between border-t border-[var(--color-border)] pt-2"
                >
                  <span>{status}</span>
                  <span className="font-medium">{count}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">
            Oportunidades por etapa
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {Object.keys(metrics.opportunitiesByStage).length === 0 ? (
              <li className="text-[var(--color-muted-foreground)]">
                Sin oportunidades registradas
              </li>
            ) : (
              Object.entries(metrics.opportunitiesByStage).map(
                ([stage, count]) => (
                  <li
                    key={stage}
                    className="flex items-center justify-between border-t border-[var(--color-border)] pt-2"
                  >
                    <span>{stage}</span>
                    <span className="font-medium">{count}</span>
                  </li>
                ),
              )
            )}
          </ul>
          <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
            Campañas activas/borrador: {metrics.activeCampaigns} · Análisis
            registrados: {metrics.totalAnalyses}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">
            Prospectos recientes
          </h2>
          <Link
            href="/prospects"
            className="text-xs font-medium text-[var(--color-brand)] hover:underline"
          >
            Ver todos
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-[var(--color-border)]">
          {metrics.recentProspects.map((prospect) => (
            <li
              key={prospect.id}
              className="flex items-center justify-between py-3 text-sm"
            >
              <div>
                <Link
                  href={`/prospects/${prospect.id}`}
                  className="font-medium text-[var(--color-brand)] hover:underline"
                >
                  {prospect.businessName}
                </Link>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {prospect.category ?? "Sin categoría"} · {prospect.status}
                </p>
              </div>
              <span className="text-xs text-[var(--color-muted-foreground)]">
                {new Date(prospect.createdAt).toLocaleDateString("es-PE")}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-[var(--color-muted-foreground)]">
          Generado {new Date(metrics.generatedAt).toLocaleString("es-PE")} ·
          Datos reales de PostgreSQL
        </p>
      </div>
    </div>
  );
}
