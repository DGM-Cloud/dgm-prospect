import {
  overpassProvider,
  type BusinessDataProvider,
  type DiscoverySearchResult,
  type NormalizedBusiness,
} from "@/infrastructure/osm";
import { overtureProvider } from "@/infrastructure/overture";
import {
  BUSINESS_CATEGORIES,
  type BusinessCategoryConfig,
  type DiscoveryProviderName,
  type SearchRadiusKm,
} from "@/shared/config/business-categories";
import { osmPlaceRepository } from "@/modules/businesses/repositories/osm-place-repository";
import {
  enrichDiscoveryResults,
  type EnrichedDiscoveryBusiness,
} from "../lib/enrich-results";

export type DiscoverySearchParams = {
  latitude: number;
  longitude: number;
  radiusKm: SearchRadiusKm;
  categoryIds: string[];
  provider?: DiscoveryProviderName;
  persist?: boolean;
  enrichWebsiteSocials?: boolean;
};

export type DiscoverySearchResponse = {
  businesses: EnrichedDiscoveryBusiness[];
  queriedAt: string;
  provider: string;
  attribution: string;
  cached?: boolean;
  total: number;
  primaryTotal: number;
  duplicateTotal: number;
};

function resolveCategories(categoryIds: string[]): BusinessCategoryConfig[] {
  const selected = BUSINESS_CATEGORIES.filter((c) =>
    categoryIds.includes(c.id),
  );
  if (selected.length === 0) {
    throw new Error("No valid categories selected");
  }
  return selected;
}

function resolveProviders(
  name: DiscoveryProviderName,
): BusinessDataProvider[] {
  if (name === "both") {
    return [overtureProvider, overpassProvider];
  }
  if (name === "overture") {
    return [overtureProvider];
  }
  return [overpassProvider];
}

async function persistBusinesses(
  businesses: NormalizedBusiness[],
  persist: boolean,
): Promise<Array<NormalizedBusiness & { osmPlaceId: string | null }>> {
  const out: Array<NormalizedBusiness & { osmPlaceId: string | null }> = [];

  for (const business of businesses) {
    let osmPlaceId: string | null = null;

    if (persist) {
      const place = await osmPlaceRepository.upsertNormalized(business);
      osmPlaceId = place.id;
    } else {
      const existing = await osmPlaceRepository.findByOsmKey(
        business.osmType,
        BigInt(business.osmId),
      );
      osmPlaceId = existing?.id ?? null;
    }

    out.push({ ...business, osmPlaceId });
  }

  return out;
}

export class DiscoveryService {
  async search(params: DiscoverySearchParams): Promise<DiscoverySearchResponse> {
    const categories = resolveCategories(params.categoryIds);
    const providerName = params.provider ?? "both";
    const providers = resolveProviders(providerName);
    const searchInput = {
      center: {
        latitude: params.latitude,
        longitude: params.longitude,
      },
      radiusKm: params.radiusKm,
      categories,
    };

    const results = await Promise.all(
      providers.map(async (provider) => {
        try {
          return await provider.search(searchInput);
        } catch (error) {
          // When merging both sources, keep the successful one.
          if (providers.length > 1) {
            console.warn(
              `[discovery] provider ${provider.name} failed:`,
              error,
            );
            return null;
          }
          throw error;
        }
      }),
    );

    const successful = results.filter(
      (result): result is DiscoverySearchResult => result != null,
    );
    if (successful.length === 0) {
      throw new Error("All discovery providers failed");
    }

    const mergedBusinesses: NormalizedBusiness[] = [];
    const seen = new Set<string>();
    for (const result of successful) {
      for (const business of result.businesses) {
        const key = `${business.osmType}-${business.osmId}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        mergedBusinesses.push(business);
      }
    }

    const persist = params.persist !== false;
    const persisted = await persistBusinesses(mergedBusinesses, persist);
    const businesses = await enrichDiscoveryResults(persisted, {
      enrichWebsiteSocials: params.enrichWebsiteSocials !== false,
    });

    const primaryTotal = businesses.filter((b) => b.isPrimary).length;
    const duplicateTotal = businesses.length - primaryTotal;
    const attribution = [...new Set(successful.map((r) => r.attribution))].join(
      " · ",
    );
    const providerLabel =
      providerName === "both"
        ? successful.map((r) => r.provider).join("+")
        : successful[0]!.provider;

    return {
      businesses,
      queriedAt: new Date().toISOString(),
      provider: providerLabel,
      attribution,
      total: businesses.length,
      primaryTotal,
      duplicateTotal,
    };
  }
}

export const discoveryService = new DiscoveryService();
