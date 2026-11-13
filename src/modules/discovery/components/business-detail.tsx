"use client";

import { ExternalLink, MapPin, Phone, Globe, Share2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { socialPlatformLabel } from "../lib/socials";
import type { DiscoveryBusiness } from "../types/client";

type BusinessDetailProps = {
  business: DiscoveryBusiness | null;
  onSave: (business: DiscoveryBusiness) => void;
  saving: boolean;
  saveMessage: string | null;
  saveError: string | null;
};

export function BusinessDetail({
  business,
  onSave,
  saving,
  saveMessage,
  saveError,
}: BusinessDetailProps) {
  if (!business) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-white p-5 text-sm text-[var(--color-muted-foreground)]">
        Selecciona un negocio en el mapa o en la tabla para ver el detalle.
      </div>
    );
  }

  const parts = business.addressParts;

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Detalle
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
            {business.name ?? "Sin nombre"}
          </h3>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {business.category ?? "Sin categoría"} · score{" "}
            {business.contactScore}
          </p>
          {business.tags.overture_taxonomy_primary ||
          business.tags.overture_basic_category ? (
            <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">
              Overture:{" "}
              {business.tags.overture_taxonomy_primary ||
                business.tags.overture_basic_category}
              {business.tags.overture_basic_category &&
              business.tags.overture_taxonomy_primary &&
              business.tags.overture_basic_category !==
                business.tags.overture_taxonomy_primary
                ? ` · basic: ${business.tags.overture_basic_category}`
                : null}
            </p>
          ) : null}
        </div>
        <span className="rounded-md bg-[var(--color-muted)] px-2 py-1 text-xs font-semibold text-[var(--color-ink)]">
          {business.contactScore}
        </span>
      </div>

      {business.matchedKeys.length > 0 ? (
        <p className="mt-2 text-xs text-amber-700">
          Posible duplicado cruzado ({business.sources.join(" + ")}). Se
          fusionaron datos de contacto en el registro principal.
        </p>
      ) : null}

      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand)]" />
          <div className="min-w-0">
            <dt className="font-medium">Dirección</dt>
            <dd className="text-[var(--color-muted-foreground)]">
              {parts.formatted ?? business.address ?? "No disponible"}
            </dd>
            <dd className="mt-1 space-y-0.5 text-xs text-[var(--color-muted-foreground)]">
              {parts.street ? <div>Calle: {parts.street}</div> : null}
              {parts.locality ? <div>Distrito: {parts.locality}</div> : null}
              {parts.postcode ? <div>CP: {parts.postcode}</div> : null}
              <div>
                {business.latitude.toFixed(5)}, {business.longitude.toFixed(5)}
              </div>
            </dd>
            <dd className="mt-2 flex flex-wrap gap-2">
              <a
                href={business.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-brand)] hover:underline"
              >
                Abrir en OSM
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={business.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-brand)] hover:underline"
              >
                Abrir en Maps
                <ExternalLink className="h-3 w-3" />
              </a>
            </dd>
          </div>
        </div>
        <div className="flex gap-2">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand)]" />
          <div>
            <dt className="font-medium">Teléfono</dt>
            <dd className="text-[var(--color-muted-foreground)]">
              {business.phone ?? "No disponible"}
            </dd>
          </div>
        </div>
        <div className="flex gap-2">
          <Globe className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand)]" />
          <div className="min-w-0">
            <dt className="font-medium">Sitio web</dt>
            <dd className="text-[var(--color-muted-foreground)]">
              {business.website ? (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 break-all text-[var(--color-brand)] hover:underline"
                >
                  {business.website}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : (
                "No disponible"
              )}
            </dd>
          </div>
        </div>
        <div className="flex gap-2">
          <Share2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand)]" />
          <div className="min-w-0">
            <dt className="font-medium">Redes sociales</dt>
            <dd className="text-[var(--color-muted-foreground)]">
              {business.socials.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {business.socials.map((url) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[var(--color-brand)] hover:underline"
                      >
                        {socialPlatformLabel(url)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                "No disponible"
              )}
              {business.socialsEnrichedFromWebsite ? (
                <p className="mt-1 text-[11px]">
                  Algunas redes se detectaron en el sitio web del negocio.
                </p>
              ) : null}
            </dd>
          </div>
        </div>
      </dl>

      <div className="mt-5 space-y-2">
        <Button
          type="button"
          className="w-full"
          disabled={!business.osmPlaceId || saving || !business.isPrimary}
          onClick={() => onSave(business)}
        >
          {saving ? "Guardando…" : "Guardar como prospecto"}
        </Button>
        {!business.isPrimary ? (
          <p className="text-xs text-amber-700">
            Este registro es un duplicado. Usa el principal (mayor score).
          </p>
        ) : null}
        {!business.osmPlaceId ? (
          <p className="text-xs text-amber-700">
            Este resultado aún no tiene registro persistido. Ejecuta la búsqueda
            de nuevo.
          </p>
        ) : null}
        {saveMessage ? (
          <p className="text-xs text-emerald-700">{saveMessage}</p>
        ) : null}
        {saveError ? <p className="text-xs text-red-600">{saveError}</p> : null}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-[var(--color-muted-foreground)]">
        Redes desde Overture/OSM; si faltan y hay web, se revisa la homepage del
        negocio (no Google). Ordenados por score de contacto.
      </p>
    </div>
  );
}
