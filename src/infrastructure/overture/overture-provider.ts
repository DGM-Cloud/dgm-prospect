import {
  type BusinessDataProvider,
  type DiscoverySearchInput,
  type DiscoverySearchResult,
  type NormalizedBusiness,
} from "@/infrastructure/osm/types";
import { SimpleTtlCache } from "@/infrastructure/osm/simple-cache";
import { ConcurrencyLimiter } from "@/infrastructure/osm/concurrency";
import { cacheKey } from "@/infrastructure/osm/overpass-query";
import { haversineKm, radiusToBBox } from "./bbox";
import {
  collectOvertureCategoryValues,
  resolveDgmCategoryLabel,
} from "./category-map";
import { withDuckDbConnection } from "./duckdb-client";
import { overtureIdToStableBigInt } from "./id";

const OVERTURE_ATTRIBUTION =
  "Data © Overture Maps Foundation (CDLA Permissive 2.0 / Apache 2.0). Monthly Places release.";

const DEFAULT_RELEASE =
  process.env.OVERTURE_RELEASE?.trim() || "2026-10-21.0";

type CachedPayload = {
  businesses: NormalizedBusiness[];
  queriedAt: string;
};

export class OvertureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OvertureError";
  }
}

export type OvertureProviderOptions = {
  release?: string;
  cacheTtlMs?: number;
  maxConcurrent?: number;
};

function firstString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string" && item.trim()) {
        return item.trim();
      }
    }
  }
  return null;
}

function allStrings(value: unknown): string[] {
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export class OvertureProvider implements BusinessDataProvider {
  readonly name = "overture";

  private readonly release: string;
  private readonly cache: SimpleTtlCache<CachedPayload>;
  private readonly limiter: ConcurrencyLimiter;

  constructor(options: OvertureProviderOptions = {}) {
    this.release = options.release ?? DEFAULT_RELEASE;
    this.cache = new SimpleTtlCache(options.cacheTtlMs ?? 15 * 60_000);
    this.limiter = new ConcurrencyLimiter(options.maxConcurrent ?? 1);
  }

  async search(input: DiscoverySearchInput): Promise<DiscoverySearchResult> {
    if (input.categories.length === 0) {
      throw new OvertureError("At least one category is required");
    }

    const key = `overture|${cacheKey(input)}|${this.release}`;
    const cached = this.cache.get(key);
    if (cached) {
      return {
        businesses: cached.businesses,
        queriedAt: new Date(cached.queriedAt),
        provider: this.name,
        attribution: OVERTURE_ATTRIBUTION,
      };
    }

    const businesses = await this.limiter.run(() => this.queryPlaces(input));
    const queriedAt = new Date();
    this.cache.set(key, {
      businesses,
      queriedAt: queriedAt.toISOString(),
    });

    return {
      businesses,
      queriedAt,
      provider: this.name,
      attribution: OVERTURE_ATTRIBUTION,
    };
  }

  private async queryPlaces(
    input: DiscoverySearchInput,
  ): Promise<NormalizedBusiness[]> {
    const bbox = radiusToBBox(input.center, input.radiusKm);
    const categoryValues = collectOvertureCategoryValues(input.categories);
    if (categoryValues.length === 0) {
      return [];
    }

    // Prefer S3 (official). Azure HTTPS globs can crash DuckDB native on Windows.
    const parquetGlob = `s3://overturemaps-us-west-2/release/${this.release}/theme=places/type=place/*`;
    const placeholders = categoryValues.map(() => "?").join(", ");

    const sql = `
      SELECT
        id,
        names.primary AS name,
        NULLIF(basic_category, '') AS basic_category,
        taxonomy.primary AS taxonomy_primary,
        ST_Y(geometry) AS latitude,
        ST_X(geometry) AS longitude,
        phones AS phones,
        websites AS websites,
        socials AS socials,
        emails AS emails,
        list_element(addresses, 1).freeform AS address_freeform,
        list_element(addresses, 1).locality AS address_locality,
        list_element(addresses, 1).postcode AS address_postcode,
        confidence AS confidence,
        operating_status AS operating_status
      FROM read_parquet(?, hive_partitioning=1)
      WHERE bbox.xmin BETWEEN ? AND ?
        AND bbox.ymin BETWEEN ? AND ?
        AND (
          lower(COALESCE(basic_category, '')) IN (${placeholders})
          OR lower(COALESCE(taxonomy.primary, '')) IN (${placeholders})
        )
        AND (operating_status IS NULL OR operating_status != 'permanently_closed')
      LIMIT 2000
    `;

    const params: unknown[] = [
      parquetGlob,
      bbox.west,
      bbox.east,
      bbox.south,
      bbox.north,
      ...categoryValues,
      ...categoryValues,
    ];

    let rows: Record<string, unknown>[];
    try {
      rows = await withDuckDbConnection((query) => query(sql, params));
    } catch (error) {
      throw new OvertureError(
        error instanceof Error
          ? `Overture query failed: ${error.message}`
          : "Overture query failed",
      );
    }

    const businesses: NormalizedBusiness[] = [];
    const seen = new Set<string>();

    for (const row of rows) {
      const overtureId = firstString(row.id);
      const latitude = asNumber(row.latitude);
      const longitude = asNumber(row.longitude);
      if (!overtureId || latitude == null || longitude == null) {
        continue;
      }

      const distance = haversineKm(input.center, { latitude, longitude });
      if (distance > input.radiusKm) {
        continue;
      }

      if (seen.has(overtureId)) {
        continue;
      }
      seen.add(overtureId);

      const basicCategory = firstString(row.basic_category);
      const taxonomyPrimary = firstString(row.taxonomy_primary);
      // Prefer the taxonomy/basic value that actually matches the selected filters.
      const matchedRaw =
        (taxonomyPrimary &&
        resolveDgmCategoryLabel(taxonomyPrimary, input.categories)
          ? taxonomyPrimary
          : null) ??
        (basicCategory &&
        resolveDgmCategoryLabel(basicCategory, input.categories)
          ? basicCategory
          : null) ??
        taxonomyPrimary ??
        basicCategory;
      const mappedCategory = resolveDgmCategoryLabel(
        matchedRaw,
        input.categories,
      );

      // Drop rows that only matched via a non-selected Overture label edge case.
      if (!mappedCategory) {
        continue;
      }

      const phone = firstString(row.phones);
      const website = firstString(row.websites);
      const socials = allStrings(row.socials);
      const email = firstString(row.emails);
      const freeform = firstString(row.address_freeform);
      const locality = firstString(row.address_locality);
      const postcode = firstString(row.address_postcode);
      const addressDisplay = [
        freeform,
        locality && (!freeform || !freeform.includes(locality))
          ? locality
          : null,
        postcode,
      ].filter(Boolean);

      businesses.push({
        osmType: "overture",
        osmId: overtureIdToStableBigInt(overtureId),
        name: firstString(row.name),
        category: mappedCategory,
        latitude,
        longitude,
        phone,
        website,
        address: addressDisplay.join(", ") || null,
        tags: {
          source: "overture",
          overture_id: overtureId,
          overture_category: matchedRaw ?? "",
          overture_basic_category: basicCategory ?? "",
          overture_taxonomy_primary: taxonomyPrimary ?? "",
          overture_release: this.release,
          confidence: String(row.confidence ?? ""),
          operating_status: String(row.operating_status ?? ""),
          email: email ?? "",
          social: socials[0] ?? "",
          socials: JSON.stringify(socials),
          address_street: freeform ?? "",
          address_locality: locality ?? "",
          address_postcode: postcode ?? "",
        },
      });
    }

    return businesses;
  }
}

export const overtureProvider = new OvertureProvider();
