"use client";

import { useEffect, useState } from "react";
import type { DiscoveryProviderName } from "@/shared/config/business-categories";

const ESTIMATE_SECONDS: Record<DiscoveryProviderName, number> = {
  overture: 45,
  overpass: 25,
  both: 90,
};

type SearchProgressProps = {
  active: boolean;
  provider: DiscoveryProviderName;
};

function formatSeconds(total: number) {
  const safe = Math.max(0, Math.ceil(total));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  if (minutes <= 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export function SearchProgress({ active, provider }: SearchProgressProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const estimateSeconds = ESTIMATE_SECONDS[provider];

  useEffect(() => {
    if (!active) {
      setElapsedMs(0);
      return;
    }

    const startedAt = Date.now();
    setElapsedMs(0);
    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 250);

    return () => window.clearInterval(timer);
  }, [active]);

  if (!active) {
    return null;
  }

  const elapsedSeconds = elapsedMs / 1000;
  const remainingSeconds = Math.max(0, estimateSeconds - elapsedSeconds);
  const softProgress = Math.min(92, (elapsedSeconds / estimateSeconds) * 100);

  return (
    <div
      className="rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/60 px-4 py-3"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--color-ink)]">
        <p className="font-medium">Buscando negocios…</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Transcurrido {formatSeconds(elapsedSeconds)}
          {remainingSeconds > 0
            ? ` · estimado restante ~${formatSeconds(remainingSeconds)}`
            : " · casi listo, puede tardar un poco más"}
        </p>
      </div>

      <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-white">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-brand)] transition-[width] duration-300 ease-out"
          style={{ width: `${softProgress}%` }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/55 to-transparent"
          style={{ animation: "search-shimmer 1.4s ease-in-out infinite" }}
        />
      </div>

      <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
        {provider === "both"
          ? "Consulta Overture + OSM, cruza duplicados y puede revisar webs. Suele tomar 1–2 minutos."
          : provider === "overture"
            ? "Descarga Places desde S3/DuckDB. Suele tomar menos de 1 minuto."
            : "Consulta Overpass. Suele tomar unos 20–40 segundos."}
      </p>
    </div>
  );
}
