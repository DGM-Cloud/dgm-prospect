"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { EmptyState } from "@/shared/components/empty-state";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { PROSPECT_STATUSES } from "@/shared/types/enums";

type ProspectListItem = {
  id: string;
  businessName: string;
  category: string | null;
  status: string;
  source: string;
  createdAt: string;
  assignedTo: { id: string; fullName: string } | null;
};

type ListResponse = {
  items: ProspectListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type MetaResponse = {
  statuses: string[];
  categories: string[];
  assignees: Array<{ id: string; fullName: string; email: string }>;
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }
  return payload.data as T;
}

export function ProspectsWorkspace() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, category, assignedToId]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", "20");
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (assignedToId) params.set("assignedToId", assignedToId);
    return params.toString();
  }, [page, debouncedSearch, status, category, assignedToId]);

  const metaQuery = useQuery({
    queryKey: ["prospects-meta"],
    queryFn: () => fetchJson<MetaResponse>("/api/v1/prospects/meta"),
  });

  const listQuery = useQuery({
    queryKey: ["prospects", queryString],
    queryFn: () => fetchJson<ListResponse>(`/api/v1/prospects?${queryString}`),
  });

  const categories = metaQuery.data?.categories ?? [];
  const assignees = metaQuery.data?.assignees ?? [];
  const data = listQuery.data;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-1 xl:col-span-2">
            <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Buscar
            </label>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre del negocio"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
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
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Categoría
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">Todas</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Responsable
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
              value={assignedToId}
              onChange={(event) => setAssignedToId(event.target.value)}
            >
              <option value="">Todos</option>
              {assignees.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {listQuery.isError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {listQuery.error instanceof Error
            ? listQuery.error.message
            : "Error al cargar prospectos"}
        </div>
      ) : null}

      {listQuery.isLoading ? (
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-muted-foreground)]">
          Cargando prospectos…
        </div>
      ) : !data || data.total === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay prospectos con estos filtros"
          description="Ajusta la búsqueda o guarda negocios desde Business Explorer."
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {data.total} resultado{data.total === 1 ? "" : "s"}
          </p>
          <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--color-muted)] text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Negocio</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Responsable</th>
                  <th className="px-4 py-3 font-medium">Descubierto</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((prospect) => (
                  <tr
                    key={prospect.id}
                    className="border-t border-[var(--color-border)] hover:bg-[var(--color-muted)]/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/prospects/${prospect.id}`}
                        className="font-medium text-[var(--color-brand)] hover:underline"
                      >
                        {prospect.businessName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {prospect.category ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {prospect.status}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {prospect.assignedTo?.fullName ?? "Sin asignar"}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {new Date(prospect.createdAt).toLocaleDateString("es-PE")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Anterior
            </Button>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Página {data.page} de {Math.max(data.totalPages, 1)}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
