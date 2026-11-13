import type { BusinessCategoryConfig } from "@/shared/config/business-categories";
import type { DiscoverySearchInput } from "./types";

export function radiusMeters(radiusKm: number): number {
  return Math.round(radiusKm * 1000);
}

export function buildOverpassQuery(input: DiscoverySearchInput): string {
  const radius = radiusMeters(input.radiusKm);
  const { latitude, longitude } = input.center;
  const clauses: string[] = [];

  for (const category of input.categories) {
    for (const tag of category.osmTags) {
      const filter = `["${tag.key}"="${tag.value}"]`;
      const around = `(around:${radius},${latitude},${longitude})`;
      clauses.push(`  node${filter}${around};`);
      clauses.push(`  way${filter}${around};`);
      clauses.push(`  relation${filter}${around};`);
    }
  }

  return `[out:json][timeout:25];
(
${clauses.join("\n")}
);
out center tags;`;
}

export function resolveCategoryLabel(
  tags: Record<string, string>,
  categories: BusinessCategoryConfig[],
): string | null {
  for (const category of categories) {
    for (const tag of category.osmTags) {
      if (tags[tag.key] === tag.value) {
        return category.label;
      }
    }
  }
  return null;
}

export function buildAddress(tags: Record<string, string>): string | null {
  const parts = [
    tags["addr:street"],
    tags["addr:housenumber"],
    tags["addr:city"] ?? tags["addr:suburb"],
  ].filter(Boolean);

  if (parts.length === 0) {
    return tags["addr:full"] ?? null;
  }

  const street = [tags["addr:street"], tags["addr:housenumber"]]
    .filter(Boolean)
    .join(" ");
  const city = tags["addr:city"] ?? tags["addr:suburb"];
  return [street || null, city].filter(Boolean).join(", ") || null;
}

export function cacheKey(input: DiscoverySearchInput): string {
  const categoryIds = input.categories
    .map((c) => c.id)
    .sort()
    .join(",");
  return [
    input.center.latitude.toFixed(4),
    input.center.longitude.toFixed(4),
    String(input.radiusKm),
    categoryIds,
  ].join("|");
}
