"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { CAMPAIGN_STATUSES } from "@/shared/types/enums";

type CampaignDetailData = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  zoneLabel: string | null;
  categories: string[];
  createdBy: { fullName: string };
  prospects: Array<{
    addedAt: string;
    prospect: {
      id: string;
      businessName: string;
      category: string | null;
      status: string;
      assignedTo: { fullName: string } | null;
    };
  }>;
  stats: {
    totalProspects: number;
    byStatus: Record<string, number>;
  };
};

type ProspectOption = {
  id: string;
  businessName: string;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }
  return payload.data as T;
}

export function CampaignDetail({ campaignId }: { campaignId: string }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [prospectSearch, setProspectSearch] = useState("");
  const [selectedProspectId, setSelectedProspectId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: async () => {
      const data = await fetchJson<CampaignDetailData>(
        `/api/v1/campaigns/${campaignId}`,
      );
      setStatus(data.status);
      return data;
    },
  });

  const prospectsQuery = useQuery({
    queryKey: ["prospects-options", prospectSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ pageSize: "20" });
      if (prospectSearch.trim()) params.set("search", prospectSearch.trim());
      const data = await fetchJson<{ items: ProspectOption[] }>(
        `/api/v1/prospects?${params.toString()}`,
      );
      return data.items;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () =>
      fetchJson(`/api/v1/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
    onSuccess: async () => {
      setMessage("Campaña actualizada.");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (err: Error) => {
      setError(err.message);
      setMessage(null);
    },
  });

  const addMutation = useMutation({
    mutationFn: async () =>
      fetchJson(`/api/v1/campaigns/${campaignId}/prospects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: selectedProspectId }),
      }),
    onSuccess: async () => {
      setSelectedProspectId("");
      setMessage("Prospecto asociado a la campaña.");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (err: Error) => {
      setError(err.message);
      setMessage(null);
    },
  });

  if (detailQuery.isLoading) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-white p-8 text-sm text-[var(--color-muted-foreground)]">
        Cargando campaña…
      </div>
    );
  }

  const campaign = detailQuery.data;
  if (!campaign) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Campaña no encontrada.{" "}
        <Link href="/campaigns" className="underline">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/campaigns"
          className="text-xs font-medium text-[var(--color-brand)] hover:underline"
        >
          ← Campañas
        </Link>
        <h2 className="mt-1 text-xl font-semibold text-[var(--color-ink)]">
          {campaign.name}
        </h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {campaign.zoneLabel ?? "Sin zona"} · Creada por{" "}
          {campaign.createdBy.fullName}
        </p>
        {campaign.description ? (
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            {campaign.description}
          </p>
        ) : null}
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
          <h3 className="text-sm font-semibold">Estado y métricas</h3>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Estado
              </label>
              <select
                className="flex h-10 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {CAMPAIGN_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              Actualizar
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-[var(--color-muted)] p-3">
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Prospectos
              </p>
              <p className="text-lg font-semibold">
                {campaign.stats.totalProspects}
              </p>
            </div>
            {Object.entries(campaign.stats.byStatus).map(([key, value]) => (
              <div key={key} className="rounded-md bg-[var(--color-muted)] p-3">
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {key}
                </p>
                <p className="text-lg font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
            Categorías:{" "}
            {campaign.categories.length > 0
              ? campaign.categories.join(", ")
              : "—"}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
          <h3 className="text-sm font-semibold">Asociar prospecto</h3>
          <div className="mt-3 space-y-2">
            <Input
              placeholder="Buscar prospecto por nombre"
              value={prospectSearch}
              onChange={(event) => setProspectSearch(event.target.value)}
            />
            <select
              className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
              value={selectedProspectId}
              onChange={(event) => setSelectedProspectId(event.target.value)}
            >
              <option value="">Selecciona un prospecto</option>
              {(prospectsQuery.data ?? []).map((prospect) => (
                <option key={prospect.id} value={prospect.id}>
                  {prospect.businessName}
                </option>
              ))}
            </select>
            <Button
              type="button"
              disabled={!selectedProspectId || addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              Añadir a la campaña
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--color-muted)] text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
            <tr>
              <th className="px-4 py-3 font-medium">Prospecto</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Responsable</th>
              <th className="px-4 py-3 font-medium">Añadido</th>
            </tr>
          </thead>
          <tbody>
            {campaign.prospects.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-[var(--color-muted-foreground)]"
                >
                  Aún no hay prospectos en esta campaña.
                </td>
              </tr>
            ) : (
              campaign.prospects.map((item) => (
                <tr
                  key={item.prospect.id}
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
                    {item.prospect.category ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {item.prospect.status}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {item.prospect.assignedTo?.fullName ?? "Sin asignar"}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {new Date(item.addedAt).toLocaleDateString("es-PE")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
