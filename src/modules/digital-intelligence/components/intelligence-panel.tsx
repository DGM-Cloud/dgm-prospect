"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { DGM_SERVICES } from "@/shared/config/dgm-services";
import { OPPORTUNITY_STAGES } from "@/shared/types/enums";

type AnalysisItem = {
  id: string;
  finding: string;
  opportunity: string | null;
  confidence: number | null;
  source: string | null;
  createdAt: string;
};

type OpportunityItem = {
  id: string;
  service: string;
  stage: string;
  estimatedValue: string | number | null;
  notes: string | null;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Request failed");
  return payload.data as T;
}

export function IntelligencePanel({ prospectId }: { prospectId: string }) {
  const queryClient = useQueryClient();
  const [finding, setFinding] = useState("");
  const [opportunityNote, setOpportunityNote] = useState("");
  const [service, setService] = useState<string>(DGM_SERVICES[0].id);
  const [stage, setStage] = useState<string>("IDENTIFIED");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analysesQuery = useQuery({
    queryKey: ["analyses", prospectId],
    queryFn: () =>
      fetchJson<AnalysisItem[]>(
        `/api/v1/analyses?prospectId=${encodeURIComponent(prospectId)}`,
      ),
  });

  const opportunitiesQuery = useQuery({
    queryKey: ["opportunities", prospectId],
    queryFn: async () => {
      const data = await fetchJson<{ items: OpportunityItem[] }>(
        `/api/v1/opportunities?prospectId=${encodeURIComponent(prospectId)}&pageSize=50`,
      );
      return data.items;
    },
  });

  const analysisMutation = useMutation({
    mutationFn: async () =>
      fetchJson("/api/v1/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId,
          finding,
          opportunity: opportunityNote || undefined,
          source: "manual",
          confidence: 0.7,
        }),
      }),
    onSuccess: async () => {
      setFinding("");
      setOpportunityNote("");
      setMessage("Hallazgo registrado.");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["analyses", prospectId] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
    onError: (err: Error) => {
      setError(err.message);
      setMessage(null);
    },
  });

  const opportunityMutation = useMutation({
    mutationFn: async () =>
      fetchJson("/api/v1/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId,
          service,
          stage,
          notes: opportunityNote || undefined,
        }),
      }),
    onSuccess: async () => {
      setMessage("Oportunidad creada.");
      setError(null);
      await queryClient.invalidateQueries({
        queryKey: ["opportunities", prospectId],
      });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
    onError: (err: Error) => {
      setError(err.message);
      setMessage(null);
    },
  });

  return (
    <div className="space-y-4 rounded-lg border border-[var(--color-border)] bg-white p-5">
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-ink)]">
          Inteligencia comercial
        </h3>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Hallazgos manuales y oportunidades para servicios DGM. El análisis web
          masivo llegará con workers (BullMQ) cuando exista infraestructura real.
        </p>
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Nuevo hallazgo
          </p>
          <textarea
            className="min-h-24 w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
            placeholder="Ej. Sin sitio web activo / Instagram inactivo"
            value={finding}
            onChange={(event) => setFinding(event.target.value)}
          />
          <textarea
            className="min-h-16 w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
            placeholder="Oportunidad sugerida (opcional)"
            value={opportunityNote}
            onChange={(event) => setOpportunityNote(event.target.value)}
          />
          <Button
            type="button"
            size="sm"
            disabled={finding.trim().length < 3 || analysisMutation.isPending}
            onClick={() => analysisMutation.mutate()}
          >
            Guardar hallazgo
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Nueva oportunidad
          </p>
          <select
            className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
            value={service}
            onChange={(event) => setService(event.target.value)}
          >
            {DGM_SERVICES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
            value={stage}
            onChange={(event) => setStage(event.target.value)}
          >
            {OPPORTUNITY_STAGES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={opportunityMutation.isPending}
            onClick={() => opportunityMutation.mutate()}
          >
            Crear oportunidad
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Hallazgos
          </h4>
          <ul className="mt-2 space-y-2 text-sm">
            {(analysesQuery.data ?? []).length === 0 ? (
              <li className="text-[var(--color-muted-foreground)]">
                Sin hallazgos todavía
              </li>
            ) : (
              (analysesQuery.data ?? []).map((item) => (
                <li
                  key={item.id}
                  className="border-t border-[var(--color-border)] pt-2"
                >
                  <p className="font-medium">{item.finding}</p>
                  {item.opportunity ? (
                    <p className="text-[var(--color-muted-foreground)]">
                      {item.opportunity}
                    </p>
                  ) : null}
                  <p className="text-[11px] text-[var(--color-muted-foreground)]">
                    {item.source ?? "manual"} ·{" "}
                    {new Date(item.createdAt).toLocaleString("es-PE")}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Oportunidades
          </h4>
          <ul className="mt-2 space-y-2 text-sm">
            {(opportunitiesQuery.data ?? []).length === 0 ? (
              <li className="text-[var(--color-muted-foreground)]">
                Sin oportunidades
              </li>
            ) : (
              (opportunitiesQuery.data ?? []).map((item) => (
                <li
                  key={item.id}
                  className="border-t border-[var(--color-border)] pt-2"
                >
                  <p className="font-medium">
                    {DGM_SERVICES.find((s) => s.id === item.service)?.label ??
                      item.service}
                  </p>
                  <p className="text-[var(--color-muted-foreground)]">
                    {item.stage}
                    {item.estimatedValue != null
                      ? ` · valor ${item.estimatedValue}`
                      : ""}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
