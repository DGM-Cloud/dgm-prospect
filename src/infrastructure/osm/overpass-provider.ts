import { buildOverpassQuery, cacheKey } from "./overpass-query";
import {
  normalizeOverpassElements,
  type OverpassElement,
} from "./overpass-normalize";
import { SimpleTtlCache } from "./simple-cache";
import { ConcurrencyLimiter } from "./concurrency";
import type {
  BusinessDataProvider,
  DiscoverySearchInput,
  DiscoverySearchResult,
  NormalizedBusiness,
} from "./types";

const OSM_ATTRIBUTION =
  "Data © OpenStreetMap contributors (ODbL). Sourced via Overpass API.";

const DEFAULT_ENDPOINTS = [
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const USER_AGENT =
  "DGM-Prospect/0.1 (internal commercial prospecting; respectful Overpass usage)";

export class OverpassError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "OverpassError";
  }
}

type OverpassResponse = {
  elements?: OverpassElement[];
  remark?: string;
};

type CachedPayload = {
  businesses: NormalizedBusiness[];
  queriedAt: string;
};

export type OverpassProviderOptions = {
  endpoints?: string[];
  timeoutMs?: number;
  cacheTtlMs?: number;
  maxConcurrent?: number;
  maxRetries?: number;
  fetchImpl?: typeof fetch;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class OverpassProvider implements BusinessDataProvider {
  readonly name = "overpass";

  private readonly endpoints: string[];
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly cache: SimpleTtlCache<CachedPayload>;
  private readonly limiter: ConcurrencyLimiter;
  private readonly fetchImpl: typeof fetch;

  constructor(options: OverpassProviderOptions = {}) {
    this.endpoints = options.endpoints ?? DEFAULT_ENDPOINTS;
    this.timeoutMs = options.timeoutMs ?? 45_000;
    this.maxRetries = options.maxRetries ?? 2;
    this.cache = new SimpleTtlCache(options.cacheTtlMs ?? 10 * 60_000);
    this.limiter = new ConcurrencyLimiter(options.maxConcurrent ?? 1);
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async search(input: DiscoverySearchInput): Promise<DiscoverySearchResult> {
    if (input.categories.length === 0) {
      throw new OverpassError("At least one category is required");
    }

    const key = cacheKey(input);
    const cached = this.cache.get(key);
    if (cached) {
      return {
        businesses: cached.businesses,
        queriedAt: new Date(cached.queriedAt),
        provider: this.name,
        attribution: OSM_ATTRIBUTION,
      };
    }

    const query = buildOverpassQuery(input);

    const payload = await this.limiter.run(() => this.executeQuery(query));
    const businesses = normalizeOverpassElements(
      payload.elements ?? [],
      input.categories,
    );

    const queriedAt = new Date();
    this.cache.set(key, {
      businesses,
      queriedAt: queriedAt.toISOString(),
    });

    return {
      businesses,
      queriedAt,
      provider: this.name,
      attribution: OSM_ATTRIBUTION,
    };
  }

  private async executeQuery(query: string): Promise<OverpassResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      for (const endpoint of this.endpoints) {
        try {
          return await this.fetchEndpoint(endpoint, query);
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          const status =
            error instanceof OverpassError ? error.status : undefined;
          if (status === 429 || status === 504 || status === 502) {
            await sleep(1500 * (attempt + 1));
          }
        }
      }
    }

    throw new OverpassError(
      lastError?.message ?? "All Overpass endpoints failed",
    );
  }

  private async fetchEndpoint(
    endpoint: string,
    query: string,
  ): Promise<OverpassResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Accept: "application/json",
          "User-Agent": USER_AGENT,
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new OverpassError(
          `Overpass HTTP ${response.status} from ${endpoint}`,
          response.status,
        );
      }

      return (await response.json()) as OverpassResponse;
    } catch (error) {
      if (error instanceof OverpassError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new OverpassError(`Overpass timeout after ${this.timeoutMs}ms`);
      }
      throw new OverpassError(
        error instanceof Error ? error.message : "Overpass request failed",
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

export const overpassProvider = new OverpassProvider();
