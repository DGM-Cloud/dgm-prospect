"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { PROSPECT_STATUSES } from "@/shared/types/enums";

type CampaignOption = { id: string; name: string };
type MetaResponse = { categories: string[] };

async function downloadExport(body: {
  format: "csv" | "xlsx";
  campaignId?: string;
  category?: string;
  status?: string;
}) {
  const response = await fetch("/api/v1/exports/prospects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Export failed");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? `dgm-prospects.${body.format}`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);

  return Number(response.headers.get("X-Export-Count") ?? "0");
}

export function ExportPanel() {
  const [format, setFormat] = useState<"csv" | "xlsx">("csv");
  const [campaignId, setCampaignId] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const campaignsQuery = useQuery({
    queryKey: ["campaigns-export-options"],
    queryFn: async () => {
      const response = await fetch("/api/v1/campaigns?pageSize=100");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Error");
      return payload.data.items as CampaignOption[];
    },
  });

  const metaQuery = useQuery({
    queryKey: ["prospects-meta"],
    queryFn: async () => {
      const response = await fetch("/api/v1/prospects/meta");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Error");
      return payload.data as MetaResponse;
    },
  });

  async function handleExport() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const count = await downloadExport({
        format,
        campaignId: campaignId || undefined,
        category: category || undefined,
        status: status || undefined,
      });
      setMessage(`Exportación lista (${count} filas).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al exportar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
      <h2 className="text-sm font-semibold text-[var(--color-ink)]">
        Exportar prospectos
      </h2>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
        CSV o XLSX con campos disponibles y procedencia OSM cuando exista.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
            Formato
          </label>
          <select
            className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
            value={format}
            onChange={(event) =>
              setFormat(event.target.value as "csv" | "xlsx")
            }
          >
            <option value="csv">CSV</option>
            <option value="xlsx">XLSX</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
            Campaña
          </label>
          <select
            className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
            value={campaignId}
            onChange={(event) => setCampaignId(event.target.value)}
          >
            <option value="">Todas</option>
            {(campaignsQuery.data ?? []).map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
            Categoría
          </label>
          <select
            className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">Todas</option>
            {(metaQuery.data?.categories ?? []).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
            Estado
          </label>
          <select
            className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Todos</option>
            {PROSPECT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4">
        <Button type="button" disabled={busy} onClick={() => void handleExport()}>
          {busy ? "Exportando…" : "Descargar"}
        </Button>
      </div>
      {message ? <p className="mt-2 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
