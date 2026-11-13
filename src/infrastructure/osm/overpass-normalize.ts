import type { BusinessCategoryConfig } from "@/shared/config/business-categories";
import { buildAddress, resolveCategoryLabel } from "./overpass-query";
import type { NormalizedBusiness } from "./types";

export type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export function normalizeOverpassElements(
  elements: OverpassElement[],
  categories: BusinessCategoryConfig[],
): NormalizedBusiness[] {
  const seen = new Set<string>();
  const businesses: NormalizedBusiness[] = [];

  for (const element of elements) {
    const tags = element.tags ?? {};
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;

    if (latitude == null || longitude == null) {
      continue;
    }

    const key = `${element.type}/${element.id}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    businesses.push({
      osmType: element.type,
      osmId: String(element.id),
      name: tags.name?.trim() || tags["name:es"]?.trim() || null,
      category: resolveCategoryLabel(tags, categories),
      latitude,
      longitude,
      tags,
      phone: tags.phone ?? tags["contact:phone"] ?? null,
      website: tags.website ?? tags["contact:website"] ?? null,
      address: buildAddress(tags),
    });
  }

  return businesses.sort((a, b) => {
    const nameA = a.name ?? "";
    const nameB = b.name ?? "";
    return nameA.localeCompare(nameB, "es");
  });
}
