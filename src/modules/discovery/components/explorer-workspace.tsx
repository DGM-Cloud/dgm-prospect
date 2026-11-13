"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  BUSINESS_CATEGORIES,
  DISCOVERY_PROVIDERS,
  SEARCH_RADII_KM,
  type DiscoveryProviderName,
  type SearchRadiusKm,
} from "@/shared/config/business-categories";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useDiscoverySearch } from "../hooks/use-discovery-search";
import { useCreateProspect } from "@/modules/prospects/hooks/use-create-prospect";
import {
  loadLastExplorerSearch,
  saveLastExplorerSearch,
} from "../lib/last-search-storage";
import { BusinessDetail } from "./business-detail";
import { ResultsTable } from "./results-table";
import { SearchProgress } from "./search-progress";
import type { DiscoveryBusiness, GeoPoint } from "../types/client";

const ExplorerMap = dynamic(
  () => import("./explorer-map").then((mod) => mod.ExplorerMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center rounded-lg border border-[var(--color-border)] bg-white text-sm text-[var(--color-muted-foreground)]">
        Cargando mapa…
      </div>
    ),
  },
);

function businessKey(business: DiscoveryBusiness) {
  return `${business.osmType}-${business.osmId}`;
}

const PROVIDER_LABELS: Record<DiscoveryProviderName, string> = {
  overture: "Overture Maps",
  overpass: "OpenStreetMap (Overpass)",
  both: "Overture + OSM (dedupe)",
};

const BOOTSTRAP_CENTER: GeoPoint = {
  latitude: -12.1211,
  longitude: -77.0299,
};

export function ExplorerWorkspace() {
  const [hydrated, setHydrated] = useState(false);
  const [center, setCenter] = useState<GeoPoint>(BOOTSTRAP_CENTER);
  const [latInput, setLatInput] = useState(String(BOOTSTRAP_CENTER.latitude));
  const [lngInput, setLngInput] = useState(String(BOOTSTRAP_CENTER.longitude));
  const [radiusKm, setRadiusKm] = useState<SearchRadiusKm>(1);
  const [categoryIds, setCategoryIds] = useState<string[]>(["cafes"]);
  const [provider, setProvider] = useState<DiscoveryProviderName>("both");
  const [hideDuplicates, setHideDuplicates] = useState(true);
  const [selected, setSelected] = useState<DiscoveryBusiness | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState("");

  const searchMutation = useDiscoverySearch();
  const createProspect = useCreateProspect();

  const businesses = searchMutation.data?.businesses ?? [];
  const visibleBusinesses = useMemo(
    () =>
      hideDuplicates
        ? businesses.filter((business) => business.isPrimary)
        : businesses,
    [businesses, hideDuplicates],
  );
  const selectedKey = selected ? businessKey(selected) : null;

  useEffect(() => {
    const stored = loadLastExplorerSearch();
    setCenter(stored.center);
    setLatInput(String(stored.center.latitude));
    setLngInput(String(stored.center.longitude));
    setRadiusKm(stored.radiusKm);
    setCategoryIds(stored.categoryIds);
    setProvider(stored.provider);
    setLastSavedAt(stored.savedAt);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveLastExplorerSearch({
      center,
      radiusKm,
      categoryIds,
      provider,
    });
    setLastSavedAt(new Date().toISOString());
  }, [hydrated, center, radiusKm, categoryIds, provider]);

  const categorySummary = useMemo(() => {
    return BUSINESS_CATEGORIES.filter((c) => categoryIds.includes(c.id))
      .map((c) => c.label)
      .join(", ");
  }, [categoryIds]);

  function applyCoordinateInputs() {
    const latitude = Number(latInput);
    const longitude = Number(lngInput);
    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {
      setCenter({ latitude, longitude });
    }
  }

  function handleCenterChange(point: GeoPoint) {
    setCenter(point);
    setLatInput(point.latitude.toFixed(5));
    setLngInput(point.longitude.toFixed(5));
  }

  function toggleCategory(id: string) {
    setCategoryIds((current) => {
      if (current.includes(id)) {
        if (current.length === 1) {
          return current;
        }
        return current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  }

  async function handleSearch() {
    setSaveMessage(null);
    setSaveError(null);
    applyCoordinateInputs();
    const point = {
      latitude: Number(latInput),
      longitude: Number(lngInput),
    };
    const nextCenter =
      Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
        ? point
        : center;

    setCenter(nextCenter);
    saveLastExplorerSearch({
      center: nextCenter,
      radiusKm,
      categoryIds,
      provider,
    });
    setLastSavedAt(new Date().toISOString());

    const result = await searchMutation.mutateAsync({
      latitude: nextCenter.latitude,
      longitude: nextCenter.longitude,
      radiusKm,
      categoryIds,
      provider,
    });

    const firstPrimary =
      result.businesses.find((business) => business.isPrimary) ??
      result.businesses[0];
    setSelected(firstPrimary ?? null);
  }

  async function handleSave(business: DiscoveryBusiness) {
    if (!business.osmPlaceId) {
      return;
    }
    setSaveMessage(null);
    setSaveError(null);
    try {
      await createProspect.mutateAsync({ osmPlaceId: business.osmPlaceId });
      setSaveMessage("Prospecto guardado correctamente.");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Error al guardar prospecto",
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Latitud
            </label>
            <Input
              value={latInput}
              onChange={(event) => setLatInput(event.target.value)}
              onBlur={applyCoordinateInputs}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Longitud
            </label>
            <Input
              value={lngInput}
              onChange={(event) => setLngInput(event.target.value)}
              onBlur={applyCoordinateInputs}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Radio
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
              value={radiusKm}
              onChange={(event) =>
                setRadiusKm(Number(event.target.value) as SearchRadiusKm)
              }
            >
              {SEARCH_RADII_KM.map((km) => (
                <option key={km} value={km}>
                  {km} km
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Fuente
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
              value={provider}
              onChange={(event) =>
                setProvider(event.target.value as DiscoveryProviderName)
              }
            >
              {DISCOVERY_PROVIDERS.map((name) => (
                <option key={name} value={name}>
                  {PROVIDER_LABELS[name]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              className="w-full"
              onClick={() => void handleSearch()}
              disabled={searchMutation.isPending || categoryIds.length === 0}
            >
              {searchMutation.isPending ? "Buscando…" : "Buscar negocios"}
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Categorías
          </p>
          <div className="flex flex-wrap gap-2">
            {BUSINESS_CATEGORIES.map((category) => {
              const active = categoryIds.includes(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={
                    active
                      ? "rounded-md bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white"
                      : "rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-muted)]"
                  }
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
          {lastSavedAt
            ? `Última ubicación guardada: ${center.latitude.toFixed(5)}, ${center.longitude.toFixed(5)} (${new Date(lastSavedAt).toLocaleString("es-PE")}).`
            : "Primera visita: se usa Miraflores solo como punto inicial. Al mover el mapa o buscar, se guarda en este navegador."}{" "}
          Resultados ordenados por score de contacto. Redes desde Overture/OSM
          o homepage del negocio. Usa “Overture + OSM” para marcar duplicados.
          {categorySummary ? ` Categorías: ${categorySummary}.` : null}
        </p>

        <div className="mt-3">
          <SearchProgress
            active={searchMutation.isPending}
            provider={provider}
          />
        </div>
      </div>

      {searchMutation.isError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchMutation.error instanceof Error
            ? searchMutation.error.message
            : "Error en la búsqueda"}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="h-[420px] overflow-hidden rounded-lg border border-[var(--color-border)]">
            {hydrated ? (
              <ExplorerMap
                center={center}
                radiusKm={radiusKm}
                businesses={visibleBusinesses}
                selectedId={selectedKey}
                onCenterChange={handleCenterChange}
                onSelect={setSelected}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted-foreground)]">
                Restaurando última búsqueda…
              </div>
            )}
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[var(--color-ink)]">
                Resultados
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                  <input
                    type="checkbox"
                    checked={hideDuplicates}
                    onChange={(event) =>
                      setHideDuplicates(event.target.checked)
                    }
                  />
                  Ocultar duplicados
                </label>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {searchMutation.data
                    ? `${searchMutation.data.primaryTotal} principales · ${searchMutation.data.duplicateTotal} dup · ${PROVIDER_LABELS[provider]}`
                    : "Sin búsqueda aún"}
                </p>
              </div>
            </div>
            <ResultsTable
              businesses={businesses}
              selectedKey={selectedKey}
              onSelect={setSelected}
              hideDuplicates={hideDuplicates}
            />
            {searchMutation.data ? (
              <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
                {searchMutation.data.attribution}
              </p>
            ) : null}
          </div>
        </div>

        <BusinessDetail
          business={selected}
          onSave={(business) => void handleSave(business)}
          saving={createProspect.isPending}
          saveMessage={saveMessage}
          saveError={saveError}
        />
      </div>
    </div>
  );
}
