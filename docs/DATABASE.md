# Database — DGM Prospect

## Engine

- PostgreSQL 16
- PostGIS 3.4 (`postgis/postgis:16-3.4` in Docker Compose)
- Prisma ORM 6 with versioned SQL migrations

## PostGIS notes

Prisma does **not** model geography types natively. `OsmPlace.location` is declared as:

```prisma
location Unsupported("geography(Point,4326)")?
```

The initial migration:

1. `CREATE EXTENSION IF NOT EXISTS postgis`
2. Creates `location geography(Point, 4326)`
3. Adds a GiST index `osm_places_location_gix`

Latitude/longitude columns are denormalized for simple reads and map markers. Writes that change coordinates must also update `location` via SQL (`ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography`) — see `OsmPlaceRepository`.

## Core entities

| Table | Purpose |
|-------|---------|
| `users` | Local profile + role (`ADMIN` / `MANAGER` / `MEMBER`), PK = Supabase Auth UUID |
| `osm_places` | Raw OSM businesses (unique `osmType` + `osmId`) |
| `prospects` | Commercial records (unique optional `osmPlaceId` to prevent duplicates) |
| `campaigns` / `campaign_prospects` | Campaign grouping |
| `analyses` | Findings / opportunities notes |
| `activities` | Timeline |
| `opportunities` | Pipeline stages + estimated value |

OSM data and DGM commercial data stay separated: never overwrite OSM tags with CRM edits on the prospect.

## Local commands

```bash
docker compose up -d db
pnpm db:migrate:deploy
pnpm db:seed
pnpm db:studio
```

`DATABASE_URL` example:

```
postgresql://dgm:dgm_prospect_local@localhost:5432/dgm_prospect?schema=public
```

## Seed

The seed verifies PostGIS connectivity. It does **not** invent users — insert a `users` row after creating the matching Supabase Auth account (see `prisma/seed.ts`).

## Supabase

1. Run `supabase/init.sql` in the Supabase **SQL Editor** (creates PostGIS + all DGM tables + auth sync trigger).
2. Put the Supabase **Database URI** in `DATABASE_URL` (direct connection preferred for Prisma).
3. Mark the Prisma migration as applied:

```bash
pnpm prisma migrate resolve --applied 20260312160000_init
pnpm prisma generate
```

4. Fill Auth vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`.
5. Create a user in Supabase Auth; the trigger upserts `public.users` automatically.
