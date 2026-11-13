import type { BusinessCategoryConfig } from "@/shared/config/business-categories";

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type DiscoverySearchInput = {
  center: GeoPoint;
  radiusKm: number;
  categories: BusinessCategoryConfig[];
};

export type NormalizedBusiness = {
  /** OSM geometry type, or "overture" for Overture Places GERS-backed rows */
  osmType: "node" | "way" | "relation" | "overture";
  osmId: string;
  name: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  tags: Record<string, string>;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
};

export type DiscoverySearchResult = {
  businesses: NormalizedBusiness[];
  queriedAt: Date;
  provider: string;
  attribution: string;
};

/**
 * Interchangeable business data provider.
 * First real implementation (OverpassProvider) lands in Phase 1.
 */
export interface BusinessDataProvider {
  readonly name: string;
  search(input: DiscoverySearchInput): Promise<DiscoverySearchResult>;
}

export class ProviderNotImplementedError extends Error {
  constructor(provider: string) {
    super(`${provider} is not implemented yet. Phase 1 will add OverpassProvider.`);
    this.name = "ProviderNotImplementedError";
  }
}
