"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { EmptyState } from "@/shared/components/empty-state";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { BUSINESS_CATEGORIES } from "@/shared/config/business-categories";
import { CAMPAIGN_STATUSES } from "@/shared/types/enums";

type CampaignListItem = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  zoneLabel: string | null;
  categories: string[];
  createdAt: string;
  createdBy: { fullName: string };
  _count: { prospects: number };
};

type ListResponse = {
  items: CampaignListItem[];
  total: number;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }
  return payload.data as T;
}

export function CampaignsWorkspace() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [zoneLabel, setZoneLabel] = useState("");
  const [categories, setCategories] = useState<string[]>(["veterinary"]);
  const [error, setError] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => fetchJson<ListResponse>("/api/v1/campaigns?pageSize=50"),
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      fetchJson("/api/v1/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          zoneLabel: zoneLabel || undefined,
          categories,
          status: "ACTIVE",
        }),
      }),
    onSuccess: async () => {
      setName("");
      setDescription("");
      setZoneLabel("");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  function toggleCategory(id: string) {
    setCategories((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">
          Nueva campaña
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Nombre
            </label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Veterinarias - Miraflores - Noviembre 2026"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Zona
            </label>
            <Input
              value={zoneLabel}
              onChange={(event) => setZoneLabel(event.target.value)}
              placeholder="Miraflores"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Descripción
            </label>
            <textarea
              className="min-h-20 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </div>
        <div className="mt-3">
          <p className="mb-2 text-xs font-medium text-[var(--color-muted-foreground)]">
            Categorías de búsqueda
          </p>
          <div className="flex flex-wrap gap-2">
            {BUSINESS_CATEGORIES.map((category) => {
              const active = categories.includes(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={
                    active
                      ? "rounded-md bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white"
                      : "rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs"
                  }
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <div className="mt-4">
          <Button
            type="button"
            disabled={name.trim().length < 3 || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? "Creando…" : "Crear campaña"}
          </Button>
        </div>
      </div>

      {listQuery.isLoading ? (
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-muted-foreground)]">
          Cargando campañas…
        </div>
      ) : !listQuery.data || listQuery.data.total === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Sin campañas activas"
          description="Crea una campaña por zona y categoría para organizar la prospección."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--color-muted)] text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
              <tr>
                <th className="px-4 py-3 font-medium">Campaña</th>
                <th className="px-4 py-3 font-medium">Zona</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Prospectos</th>
                <th className="px-4 py-3 font-medium">Creada por</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.data.items.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="border-t border-[var(--color-border)]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="font-medium text-[var(--color-brand)] hover:underline"
                    >
                      {campaign.name}
                    </Link>
                    {campaign.description ? (
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {campaign.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {campaign.zoneLabel ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {CAMPAIGN_STATUSES.includes(
                      campaign.status as (typeof CAMPAIGN_STATUSES)[number],
                    )
                      ? campaign.status
                      : campaign.status}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {campaign._count.prospects}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {campaign.createdBy.fullName}
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
