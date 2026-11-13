# Database

Local development uses Docker Compose (`postgis/postgis:16-3.4`) from the repository root.

```bash
docker compose up -d db
pnpm db:migrate:deploy
pnpm db:seed
```

Prisma migrations live in `prisma/migrations/`. The initial migration enables PostGIS and creates `geography(Point, 4326)` on `osm_places.location` with a GiST index.

Application code must not touch Prisma from React components. Use module repositories under `src/modules/*/repositories`.
