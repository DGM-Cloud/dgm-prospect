"use client";

import { cn } from "@/shared/utilities/cn";
import type { DiscoveryBusiness } from "../types/client";

type ResultsTableProps = {
  businesses: DiscoveryBusiness[];
  selectedKey: string | null;
  onSelect: (business: DiscoveryBusiness) => void;
  hideDuplicates?: boolean;
};

function businessKey(business: DiscoveryBusiness) {
  return `${business.osmType}-${business.osmId}`;
}

function displayUrl(url: string) {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function scoreTone(score: number) {
  if (score >= 70) return "bg-emerald-100 text-emerald-800";
  if (score >= 40) return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-600";
}

export function ResultsTable({
  businesses,
  selectedKey,
  onSelect,
  hideDuplicates = true,
}: ResultsTableProps) {
  const rows = hideDuplicates
    ? businesses.filter((business) => business.isPrimary)
    : businesses;

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-muted-foreground)]">
        Sin resultados. Ajusta el centro, el radio o las categorías y busca de
        nuevo.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
      <div className="max-h-[360px] overflow-auto">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="sticky top-0 bg-[var(--color-muted)] text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
            <tr>
              <th className="w-[8%] px-2 py-2 font-medium">Score</th>
              <th className="w-[16%] px-2 py-2 font-medium">Nombre</th>
              <th className="w-[10%] px-2 py-2 font-medium">Categoría</th>
              <th className="w-[14%] px-2 py-2 font-medium">Teléfono</th>
              <th className="w-[16%] px-2 py-2 font-medium">Web</th>
              <th className="w-[22%] px-2 py-2 font-medium">Dirección</th>
              <th className="w-[14%] px-2 py-2 font-medium">Redes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((business) => {
              const key = businessKey(business);
              const address =
                business.addressParts.formatted ?? business.address ?? "—";
              return (
                <tr
                  key={key}
                  className={cn(
                    "cursor-pointer border-t border-[var(--color-border)] hover:bg-[var(--color-muted)]/70",
                    selectedKey === key && "bg-blue-50",
                    !business.isPrimary && "opacity-70",
                  )}
                  onClick={() => onSelect(business)}
                >
                  <td className="px-2 py-2">
                    <span
                      className={cn(
                        "inline-flex min-w-[2.25rem] justify-center rounded px-1.5 py-0.5 text-xs font-semibold",
                        scoreTone(business.contactScore),
                      )}
                    >
                      {business.contactScore}
                    </span>
                  </td>
                  <td className="truncate px-2 py-2 font-medium text-[var(--color-ink)]">
                    {business.name ?? "Sin nombre"}
                    {business.matchedKeys.length > 0 ? (
                      <span className="ml-1 text-[10px] font-normal text-[var(--color-muted-foreground)]">
                        · dup
                      </span>
                    ) : null}
                  </td>
                  <td className="truncate px-2 py-2 text-[var(--color-muted-foreground)]">
                    {business.category ?? "—"}
                  </td>
                  <td className="truncate px-2 py-2 text-[var(--color-muted-foreground)]">
                    {business.phone ?? "—"}
                  </td>
                  <td className="truncate px-2 py-2 text-[var(--color-muted-foreground)]">
                    {business.website ? (
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--color-brand)] hover:underline"
                        onClick={(event) => event.stopPropagation()}
                        title={business.website}
                      >
                        {displayUrl(business.website)}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="truncate px-2 py-2 text-[var(--color-muted-foreground)]">
                    {address}
                  </td>
                  <td className="truncate px-2 py-2 text-[var(--color-muted-foreground)]">
                    {business.socials.length > 0
                      ? `${business.socials.length}`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
