"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { IntelligencePanel } from "@/modules/digital-intelligence/components/intelligence-panel";
import { PROSPECT_STATUSES, ACTIVITY_TYPES } from "@/shared/types/enums";

type ProspectDetailData = {
  id: string;
  businessName: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  status: string;
  source: string;
  notes: string | null;
  createdAt: string;
  assignedToId: string | null;
  assignedTo: { id: string; fullName: string } | null;
  osmPlace: {
    osmType: string;
    osmId: string;
    latitude: number;
    longitude: number;
  } | null;
  activities: Array<{
    id: string;
    activityType: string;
    description: string;
    createdAt: string;
    user: { fullName: string };
  }>;
  campaigns: Array<{
    campaign: { id: string; name: string; status: string };
  }>;
};

type MetaResponse = {
  assignees: Array<{ id: string; fullName: string; email: string }>;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }
  return payload.data as T;
}

type ProspectDetailProps = {
  prospectId: string;
};

export function ProspectDetail({ prospectId }: ProspectDetailProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const detailQuery = useQuery({
    queryKey: ["prospect", prospectId],
    queryFn: () =>
      fetchJson<ProspectDetailData>(`/api/v1/prospects/${prospectId}`),
  });

  const metaQuery = useQuery({
    queryKey: ["prospects-meta"],
    queryFn: () => fetchJson<MetaResponse>("/api/v1/prospects/meta"),
  });

  const prospect = detailQuery.data;

  const [form, setForm] = useState({
    businessName: "",
    category: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    instagram: "",
    facebook: "",
    status: "DISCOVERED",
    assignedToId: "",
    notes: "",
  });

  useEffect(() => {
    if (!prospect) return;
    setForm({
      businessName: prospect.businessName,
      category: prospect.category ?? "",
      address: prospect.address ?? "",
      phone: prospect.phone ?? "",
      email: prospect.email ?? "",
      website: prospect.website ?? "",
      instagram: prospect.instagram ?? "",
      facebook: prospect.facebook ?? "",
      status: prospect.status,
      assignedToId: prospect.assignedToId ?? "",
      notes: prospect.notes ?? "",
    });
  }, [prospect]);

  const saveMutation = useMutation({
    mutationFn: async () =>
      fetchJson<ProspectDetailData>(`/api/v1/prospects/${prospectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName,
          category: form.category || null,
          address: form.address || null,
          phone: form.phone || null,
          email: form.email || null,
          website: form.website || null,
          instagram: form.instagram || null,
          facebook: form.facebook || null,
          status: form.status,
          assignedToId: form.assignedToId || null,
          notes: form.notes || null,
        }),
      }),
    onSuccess: async () => {
      setMessage("Prospecto actualizado.");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["prospect", prospectId] });
      await queryClient.invalidateQueries({ queryKey: ["prospects"] });
    },
    onError: (err: Error) => {
      setError(err.message);
      setMessage(null);
    },
  });

  const activityMutation = useMutation({
    mutationFn: async () =>
      fetchJson("/api/v1/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId,
          activityType: "NOTE",
          description: noteDraft,
        }),
      }),
    onSuccess: async () => {
      setNoteDraft("");
      setMessage("Actividad registrada.");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["prospect", prospectId] });
    },
    onError: (err: Error) => {
      setError(err.message);
      setMessage(null);
    },
  });

  if (detailQuery.isLoading) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-white p-8 text-sm text-[var(--color-muted-foreground)]">
        Cargando detalle…
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Prospecto no encontrado.{" "}
        <Link href="/prospects" className="underline">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/prospects"
            className="text-xs font-medium text-[var(--color-brand)] hover:underline"
          >
            ← Prospectos
          </Link>
          <h2 className="mt-1 text-xl font-semibold text-[var(--color-ink)]">
            {prospect.businessName}
          </h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Fuente {prospect.source} · Descubierto{" "}
            {new Date(prospect.createdAt).toLocaleString("es-PE")}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>

      {message ? (
        <p className="text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4 rounded-lg border border-[var(--color-border)] bg-white p-5">
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">
            Información comercial
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {(
              [
                ["businessName", "Nombre"],
                ["category", "Categoría"],
                ["address", "Dirección"],
                ["phone", "Teléfono"],
                ["email", "Email"],
                ["website", "Website"],
                ["instagram", "Instagram"],
                ["facebook", "Facebook"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                  {label}
                </label>
                <Input
                  value={form[key]}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Estado
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                {PROSPECT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Responsable
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
                value={form.assignedToId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    assignedToId: event.target.value,
                  }))
                }
              >
                <option value="">Sin asignar</option>
                {(metaQuery.data?.assignees ?? []).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Notas internas
            </label>
            <textarea
              className="min-h-28 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </div>
          {prospect.osmPlace ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              OSM {prospect.osmPlace.osmType}/{prospect.osmPlace.osmId} ·{" "}
              {prospect.osmPlace.latitude.toFixed(5)},{" "}
              {prospect.osmPlace.longitude.toFixed(5)}
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
              Campañas
            </h3>
            {prospect.campaigns.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                Sin campañas asociadas.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {prospect.campaigns.map((item) => (
                  <li key={item.campaign.id}>
                    <Link
                      href={`/campaigns/${item.campaign.id}`}
                      className="text-[var(--color-brand)] hover:underline"
                    >
                      {item.campaign.name}
                    </Link>{" "}
                    <span className="text-[var(--color-muted-foreground)]">
                      ({item.campaign.status})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <IntelligencePanel prospectId={prospectId} />

          <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
              Actividades
            </h3>
            <div className="mt-3 space-y-2">
              <textarea
                className="min-h-20 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                placeholder="Registrar nota o seguimiento…"
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!noteDraft.trim() || activityMutation.isPending}
                onClick={() => activityMutation.mutate()}
              >
                Añadir nota
              </Button>
            </div>
            <ul className="mt-4 space-y-3">
              {prospect.activities.map((activity) => (
                <li
                  key={activity.id}
                  className="border-t border-[var(--color-border)] pt-3 text-sm"
                >
                  <p className="font-medium text-[var(--color-ink)]">
                    {activity.activityType}
                    {!ACTIVITY_TYPES.includes(
                      activity.activityType as (typeof ACTIVITY_TYPES)[number],
                    )
                      ? ""
                      : ""}{" "}
                    · {activity.user.fullName}
                  </p>
                  <p className="text-[var(--color-muted-foreground)]">
                    {activity.description}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">
                    {new Date(activity.createdAt).toLocaleString("es-PE")}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
