# Business data sources — DGM Prospect

## Principles

- Primary source: **Overture Maps Places** (monthly open GeoParquet release)
- Fallback / alternate: **OpenStreetMap** via the **Overpass API**
- No Google Maps scraping
- No indiscriminate bulk extraction
- Respect public Overpass usage policies (timeouts, concurrency limits, caching)
- Preserve attribution and provenance
- Phone, email, website, and social fields are often missing — never invent them

## Provider contract

`src/infrastructure/osm/types.ts` defines `BusinessDataProvider`:

- Search by center + radius + category sets
- Normalize into `NormalizedBusiness`
- Handle errors/timeouts

### OvertureProvider (default)

Implemented in `src/infrastructure/overture/overture-provider.ts`.

- Reads public Places GeoParquet from `s3://overturemaps-us-west-2/release/<OVERTURE_RELEASE>/theme=places/type=place/*` (default release `2026-10-21.0`)
- Uses DuckDB (`httpfs` + `spatial`, `s3_region=us-west-2`) server-side
- Filters by bbox + `basic_category` / `taxonomy.primary`, then haversine radius
- Stores rows with `osmType = "overture"` and a stable hashed bigint from the GERS id
- CDLA Permissive / Apache attribution on every response

**Note:** DuckDB is a native Node addon. Prefer local/VPS Node runtimes; serverless platforms without native module support may need a dedicated worker.

### OverpassProvider

Implemented in `src/infrastructure/osm/overpass-provider.ts`.

- Overpass QL for nodes/ways/relations with `around` + category tags
- Timeout + endpoint failover
- In-memory TTL cache
- Concurrency limiter
- OSM attribution string on every response

## Categories

Central config: `src/shared/config/business-categories.ts`

Each DGM category maps to OSM tags **and** Overture `basic_category` / taxonomy values.

Search radii: 1 / 3 / 5 / 10 km.

Providers: `overture` | `overpass` | `both` (`DISCOVERY_PROVIDERS`).

Discovery enrichment (post-search):

- Normalized address parts (calle / distrito / CP) + OSM/Google Maps links
- Contact score (phone > web > address > socials > email); results sorted by score
- Socials from Overture `socials` / OSM `contact:*`; optional homepage scan when web exists and socials are empty
- Duplicate groups (~80 m + similar name); `both` merges contact fields into the primary record

## Persistence

Normalized results upsert into `osm_places` (unique `osmType` + `osmId`). Saving as a commercial prospect creates a `prospects` row linked by `osmPlaceId` (unique) so duplicates are rejected.
