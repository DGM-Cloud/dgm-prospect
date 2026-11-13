export type AddressParts = {
  street: string | null;
  locality: string | null;
  postcode: string | null;
  formatted: string | null;
};

export type DiscoveryBusiness = {
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
  osmPlaceId: string | null;
  addressParts: AddressParts;
  mapsUrl: string;
  googleMapsUrl: string;
  contactScore: number;
  socials: string[];
  email: string | null;
  sources: string[];
  duplicateGroupId: string | null;
  isPrimary: boolean;
  matchedKeys: string[];
  socialsEnrichedFromWebsite: boolean;
};

export type DiscoverySearchData = {
  businesses: DiscoveryBusiness[];
  queriedAt: string;
  provider: string;
  attribution: string;
  total: number;
  primaryTotal: number;
  duplicateTotal: number;
};

export type GeoPoint = {
  latitude: number;
  longitude: number;
};
