"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KanbanSquare } from "lucide-react";
import { EmptyState } from "@/shared/components/empty-state";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { DGM_SERVICES } from "@/shared/config/dgm-services";
import { OPPORTUNITY_STAGES } from "@/shared/types/enums";

type OpportunityItem = {
  id: string;
  service: string;
  stage: string;
  estimatedValue: string | number | null;
  notes: string | null;
  prospect: {
    id: string;
    businessName: string;
    category: string | null;
    status: string;
  };
};

type ProspectOption = { id: string; businessName: string };

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Request failed");
  return payload.data as T;
}

export function PipelineWorkspace() {
  const queryClient = useQueryClient();
  const [prospectId, setProspectId] = useState("");
  const [service, setService] = useState<string>(DGM_SERVICES[0].id);
  const [stage, setStage] = useState<string>("IDENTIFIED");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ["opportunities"],
    queryFn: () =>
      fetchJson<{ items: OpportunityItem[]; total: number }>(
        "/api/v1/opportunities?pageSize=100",
      ),
  });

  const prospectsQuery = useQuery({
    queryKey: ["prospects-options-pipeline"],
    queryFn: async () => {
      const data = await fetchJson<{ items: ProspectOption[] }>(
        "/api/v1/prospects?pageSize=50",
      );
      return data.items;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      fetchJson("/api/v1/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId,
          service,
          stage,
          estimatedValue: estimatedValue
            ? Number(estimatedValue)
            : undefined,
          notes: notes || undefined,
        }),
      }),
    onSuccess: async () => {
      setNotes("");
      setEstimatedValue("");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateStageMutation = useMutation({
    mutationFn: async (params: { id: string; stage: string }) =>
      fetchJson(`/api/v1/opportunities/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: params.stage }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
        <h2 className="text-sm font-semibold">Nueva oportunidad DGM</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Prospecto
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
              value={prospectId}
              onChange={(event) => setProspectId(event.target.value)}
            >
              <option value="">Selecciona</option>
              {(prospectsQuery.data ?? []).map((prospect) => (
                <option key={prospect.id} value={prospect.id}>
                  {prospect.businessName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Servicio
            </label>
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
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Etapa
            </label>
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
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Valor estimado
            </label>
            <Input
              type="number"
              min="0"
              value={estimatedValue}
              onChange={(event) => setEstimatedValue(event.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
            Notas
          </label>
          <textarea
            className="min-h-20 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <div className="mt-3">
          <Button
            type="button"
            disabled={!prospectId || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            Registrar oportunidad
          </Button>
        </div>
      </div>

      {listQuery.isLoading ? (
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-muted-foreground)]">
          Cargando pipeline…
        </div>
      ) : !listQuery.data || listQuery.data.total === 0 ? (
        <EmptyState
          icon={KanbanSquare}
          title="Pipeline vacío"
          description="Registra oportunidades comerciales vinculadas a prospectos para verlas aquí."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--color-muted)] text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
              <tr>
                <th className="px-4 py-3 font-medium">Prospecto</th>
                <th className="px-4 py-3 font-medium">Servicio</th>
                <th className="px-4 py-3 font-medium">Etapa</th>
                <th className="px-4 py-3 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.data.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-[var(--color-border)]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/prospects/${item.prospect.id}`}
                      className="font-medium text-[var(--color-brand)] hover:underline"
                    >
                      {item.prospect.businessName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {DGM_SERVICES.find((s) => s.id === item.service)?.label ??
                      item.service}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="h-9 rounded-md border border-[var(--color-border)] bg-white px-2 text-sm"
                      value={item.stage}
                      onChange={(event) =>
                        updateStageMutation.mutate({
                          id: item.id,
                          stage: event.target.value,
                        })
                      }
                    >
                      {OPPORTUNITY_STAGES.map((stageOption) => (
                        <option key={stageOption} value={stageOption}>
                          {stageOption}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {item.estimatedValue ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
