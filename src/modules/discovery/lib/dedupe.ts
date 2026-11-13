import { haversineKm } from "@/infrastructure/overture/bbox";

export type DedupeCandidate = {
  key: string;
  name: string | null;
  latitude: number;
  longitude: number;
  contactScore: number;
  source: string;
};

const DUPLICATE_DISTANCE_KM = 0.08; // ~80 m

export function normalizeBusinessName(name: string | null | undefined): string {
  if (!name) {
    return "";
  }
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(
      /\b(cafe|coffee|cafeteria|bar|restaurant|the|el|la|los|las|de|del)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function namesMatch(a: string, b: string): boolean {
  if (!a || !b) {
    return false;
  }
  if (a === b) {
    return true;
  }
  if (a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a))) {
    return true;
  }
  return false;
}

/**
 * Groups nearby businesses with the same/similar name.
 * Returns map of key -> { groupId, isPrimary, matchedKeys }.
 */
export function groupDuplicates(
  items: DedupeCandidate[],
): Map<
  string,
  { groupId: string; isPrimary: boolean; matchedKeys: string[] }
> {
  const result = new Map<
    string,
    { groupId: string; isPrimary: boolean; matchedKeys: string[] }
  >();
  const assigned = new Set<string>();
  let groupCounter = 0;

  for (let i = 0; i < items.length; i += 1) {
    const current = items[i];
    if (!current || assigned.has(current.key)) {
      continue;
    }

    const group: DedupeCandidate[] = [current];
    const nameA = normalizeBusinessName(current.name);

    for (let j = i + 1; j < items.length; j += 1) {
      const other = items[j];
      if (!other || assigned.has(other.key)) {
        continue;
      }
      const nameB = normalizeBusinessName(other.name);
      if (!namesMatch(nameA, nameB)) {
        continue;
      }
      const distance = haversineKm(
        { latitude: current.latitude, longitude: current.longitude },
        { latitude: other.latitude, longitude: other.longitude },
      );
      if (distance <= DUPLICATE_DISTANCE_KM) {
        group.push(other);
      }
    }

    if (group.length === 1) {
      result.set(current.key, {
        groupId: "",
        isPrimary: true,
        matchedKeys: [],
      });
      assigned.add(current.key);
      continue;
    }

    groupCounter += 1;
    const groupId = `dup-${groupCounter}`;
    group.sort((a, b) => b.contactScore - a.contactScore);
    const primary = group[0]!;
    const matchedKeys = group.map((item) => item.key);

    for (const item of group) {
      assigned.add(item.key);
      result.set(item.key, {
        groupId,
        isPrimary: item.key === primary.key,
        matchedKeys: matchedKeys.filter((key) => key !== item.key),
      });
    }
  }

  return result;
}

/** Prefer non-empty contact fields from secondary into primary. */
export function mergeContactFields<
  T extends {
    phone?: string | null;
    website?: string | null;
    address?: string | null;
    email?: string | null;
    socials?: string[];
  },
>(primary: T, secondary: T): T {
  return {
    ...primary,
    phone: primary.phone?.trim() ? primary.phone : secondary.phone,
    website: primary.website?.trim() ? primary.website : secondary.website,
    address: primary.address?.trim() ? primary.address : secondary.address,
    email: primary.email?.trim() ? primary.email : secondary.email,
    socials: [
      ...new Set([...(primary.socials ?? []), ...(secondary.socials ?? [])]),
    ],
  };
}
