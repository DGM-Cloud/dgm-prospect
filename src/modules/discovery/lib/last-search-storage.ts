import {
  DISCOVERY_PROVIDERS,
  SEARCH_RADII_KM,
  type DiscoveryProviderName,
  type SearchRadiusKm,
} from "@/shared/config/business-categories";
import type { GeoPoint } from "../types/client";

const STORAGE_KEY = "dgm-prospect.explorer.last-search";

export type LastExplorerSearch = {
  center: GeoPoint;
  radiusKm: SearchRadiusKm;
  categoryIds: string[];
  provider: DiscoveryProviderName;
  savedAt: string;
};

const FALLBACK: LastExplorerSearch = {
  center: { latitude: -12.1211, longitude: -77.0299 },
  radiusKm: 1,
  categoryIds: ["cafes"],
  provider: "both",
  savedAt: "",
};

function isValidRadius(value: unknown): value is SearchRadiusKm {
  return (
    typeof value === "number" &&
    (SEARCH_RADII_KM as readonly number[]).includes(value)
  );
}

function isValidProvider(value: unknown): value is DiscoveryProviderName {
  return (
    typeof value === "string" &&
    (DISCOVERY_PROVIDERS as readonly string[]).includes(value)
  );
}

export function loadLastExplorerSearch(): LastExplorerSearch {
  if (typeof window === "undefined") {
    return FALLBACK;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return FALLBACK;
    }

    const parsed = JSON.parse(raw) as Partial<LastExplorerSearch>;
    const latitude = Number(parsed.center?.latitude);
    const longitude = Number(parsed.center?.longitude);
    const radiusKm = parsed.radiusKm;
    const categoryIds = Array.isArray(parsed.categoryIds)
      ? parsed.categoryIds.filter((id): id is string => typeof id === "string")
      : [];
    const provider = isValidProvider(parsed.provider)
      ? parsed.provider
      : FALLBACK.provider;

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180 ||
      !isValidRadius(radiusKm) ||
      categoryIds.length === 0
    ) {
      return FALLBACK;
    }

    return {
      center: { latitude, longitude },
      radiusKm,
      categoryIds,
      provider,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : "",
    };
  } catch {
    return FALLBACK;
  }
}

export function saveLastExplorerSearch(input: {
  center: GeoPoint;
  radiusKm: SearchRadiusKm;
  categoryIds: string[];
  provider: DiscoveryProviderName;
}): void {
  if (typeof window === "undefined") {
    return;
  }

  const payload: LastExplorerSearch = {
    center: input.center,
    radiusKm: input.radiusKm,
    categoryIds: input.categoryIds,
    provider: input.provider,
    savedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
