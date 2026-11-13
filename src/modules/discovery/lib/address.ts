export type AddressParts = {
  street: string | null;
  locality: string | null;
  postcode: string | null;
  formatted: string | null;
};

function cleanPart(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed || null;
}

export function buildAddressParts(input: {
  street?: string | null;
  locality?: string | null;
  postcode?: string | null;
  fallback?: string | null;
}): AddressParts {
  const street = cleanPart(input.street);
  const locality = cleanPart(input.locality);
  const postcode = cleanPart(input.postcode);

  if (!street && !locality && !postcode) {
    const fallback = cleanPart(input.fallback);
    return {
      street: fallback,
      locality: null,
      postcode: null,
      formatted: fallback,
    };
  }

  const localityPart =
    locality && street && street.toLowerCase().includes(locality.toLowerCase())
      ? null
      : locality;

  const formatted = [street, localityPart, postcode].filter(Boolean).join(", ");

  return {
    street,
    locality: localityPart ?? locality,
    postcode,
    formatted: formatted || null,
  };
}

export function addressPartsFromOsmTags(
  tags: Record<string, string>,
  fallbackAddress?: string | null,
): AddressParts {
  return buildAddressParts({
    street:
      tags["addr:street"] && tags["addr:housenumber"]
        ? `${tags["addr:street"]} ${tags["addr:housenumber"]}`
        : tags["addr:street"] || tags["addr:full"] || null,
    locality:
      tags["addr:city"] ||
      tags["addr:suburb"] ||
      tags["addr:district"] ||
      tags["addr:town"] ||
      null,
    postcode: tags["addr:postcode"] || null,
    fallback: fallbackAddress,
  });
}

export function mapsUrlFor(input: {
  latitude: number;
  longitude: number;
  label?: string | null;
}): string {
  const query = input.label?.trim()
    ? encodeURIComponent(
        `${input.label} @${input.latitude},${input.longitude}`,
      )
    : `${input.latitude},${input.longitude}`;
  return `https://www.openstreetmap.org/search?query=${query}#map=18/${input.latitude}/${input.longitude}`;
}

/** Google Maps search link (user-facing navigation only; not used for scraping). */
export function googleMapsUrlFor(input: {
  latitude: number;
  longitude: number;
  label?: string | null;
}): string {
  const q = input.label?.trim()
    ? encodeURIComponent(input.label)
    : `${input.latitude},${input.longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
