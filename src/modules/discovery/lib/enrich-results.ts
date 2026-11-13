import type { NormalizedBusiness } from "@/infrastructure/osm/types";
import {
  addressPartsFromOsmTags,
  buildAddressParts,
  googleMapsUrlFor,
  mapsUrlFor,
  type AddressParts,
} from "./address";
import { computeContactScore } from "./contact-score";
import { groupDuplicates, mergeContactFields } from "./dedupe";
import { collectSocials } from "./socials";
import { enrichSocialsFromWebsites } from "./website-socials";

export type EnrichedDiscoveryBusiness = NormalizedBusiness & {
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

function businessKey(business: NormalizedBusiness) {
  return `${business.osmType}-${business.osmId}`;
}

function sourceOf(business: NormalizedBusiness): string {
  if (business.osmType === "overture" || business.tags.source === "overture") {
    return "overture";
  }
  return "overpass";
}

function parseAddressParts(business: NormalizedBusiness): AddressParts {
  if (business.osmType === "overture") {
    return buildAddressParts({
      street: business.tags.address_street || null,
      locality: business.tags.address_locality || null,
      postcode: business.tags.address_postcode || null,
      fallback: business.address,
    });
  }
  return addressPartsFromOsmTags(business.tags, business.address);
}

function baseEnrich(
  business: NormalizedBusiness & { osmPlaceId: string | null },
): EnrichedDiscoveryBusiness {
  const socials = collectSocials({
    tags: business.tags,
    socialsField: business.tags.socials
      ? (() => {
          try {
            return JSON.parse(business.tags.socials) as unknown;
          } catch {
            return business.tags.social;
          }
        })()
      : business.tags.social,
  });
  const email =
    business.tags.email?.trim() ||
    business.tags["contact:email"]?.trim() ||
    null;
  const addressParts = parseAddressParts(business);
  const formatted = addressParts.formatted ?? business.address ?? null;
  const contactScore = computeContactScore({
    phone: business.phone,
    website: business.website,
    address: formatted,
    socials,
    email,
  });
  const label = business.name ?? formatted;

  return {
    ...business,
    address: formatted,
    addressParts,
    mapsUrl: mapsUrlFor({
      latitude: business.latitude,
      longitude: business.longitude,
      label,
    }),
    googleMapsUrl: googleMapsUrlFor({
      latitude: business.latitude,
      longitude: business.longitude,
      label,
    }),
    contactScore,
    socials,
    email,
    sources: [sourceOf(business)],
    duplicateGroupId: null,
    isPrimary: true,
    matchedKeys: [],
    socialsEnrichedFromWebsite: false,
  };
}

export async function enrichDiscoveryResults(
  businesses: Array<NormalizedBusiness & { osmPlaceId: string | null }>,
  options?: { enrichWebsiteSocials?: boolean },
): Promise<EnrichedDiscoveryBusiness[]> {
  let enriched = businesses.map(baseEnrich);

  if (options?.enrichWebsiteSocials !== false) {
    const websiteHits = await enrichSocialsFromWebsites(
      enriched.map((item) => ({
        key: businessKey(item),
        website: item.website ?? null,
        socials: item.socials,
      })),
    );

    if (websiteHits.size > 0) {
      enriched = enriched.map((item) => {
        const extra = websiteHits.get(businessKey(item));
        if (!extra?.length) {
          return item;
        }
        const socials = [...new Set([...item.socials, ...extra])];
        return {
          ...item,
          socials,
          socialsEnrichedFromWebsite: true,
          contactScore: computeContactScore({
            phone: item.phone,
            website: item.website,
            address: item.address,
            socials,
            email: item.email,
          }),
        };
      });
    }
  }

  const groups = groupDuplicates(
    enriched.map((item) => ({
      key: businessKey(item),
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      contactScore: item.contactScore,
      source: item.sources[0] ?? "unknown",
    })),
  );

  const byKey = new Map(enriched.map((item) => [businessKey(item), item]));

  // Merge contact fields from duplicates into primary
  for (const item of enriched) {
    const meta = groups.get(businessKey(item));
    if (!meta?.isPrimary || !meta.groupId) {
      continue;
    }
    let merged = item;
    for (const otherKey of meta.matchedKeys) {
      const other = byKey.get(otherKey);
      if (!other) {
        continue;
      }
      merged = {
        ...mergeContactFields(merged, other),
        sources: [...new Set([...merged.sources, ...other.sources])],
        addressParts: merged.addressParts.formatted
          ? merged.addressParts
          : other.addressParts,
        address:
          merged.address?.trim() ||
          other.address ||
          merged.addressParts.formatted,
      };
      merged.contactScore = computeContactScore({
        phone: merged.phone,
        website: merged.website,
        address: merged.address,
        socials: merged.socials,
        email: merged.email,
      });
    }
    byKey.set(businessKey(item), {
      ...merged,
      duplicateGroupId: meta.groupId,
      isPrimary: true,
      matchedKeys: meta.matchedKeys,
    });
  }

  for (const item of enriched) {
    const key = businessKey(item);
    const meta = groups.get(key);
    if (!meta || meta.isPrimary) {
      continue;
    }
    byKey.set(key, {
      ...item,
      duplicateGroupId: meta.groupId || null,
      isPrimary: false,
      matchedKeys: meta.matchedKeys,
    });
  }

  return [...byKey.values()].sort((a, b) => {
    if (b.contactScore !== a.contactScore) {
      return b.contactScore - a.contactScore;
    }
    const nameA = a.name ?? "";
    const nameB = b.name ?? "";
    return nameA.localeCompare(nameB, "es");
  });
}
