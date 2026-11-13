# API — DGM Prospect

Base path: `/api/v1`

Handlers live under `src/app/api/v1` and delegate to module services.

## Live in Phase 0

### `GET /api/v1/health`

Public health check.

Response `200` when the database is reachable:

```json
{
  "status": "ok",
  "service": "dgm-prospect",
  "timestamp": "2026-03-12T16:00:00.000Z",
  "checks": {
    "database": "up",
    "postgis": "3.4.x",
    "supabaseConfigured": false
  }
}
```

Returns `503` with `"status": "degraded"` if the database is down.

### `GET /api/v1/auth/me`

Requires an authenticated Supabase session (cookie).

- `200` — `{ "data": { "id", "email", "fullName", "role" } }`
- `401` — missing/invalid session
- `503` — Supabase env vars not configured

## Live in Phase 1

### `POST /api/v1/discovery/search`

Body:

```json
{
  "latitude": -12.1211,
  "longitude": -77.0299,
  "radiusKm": 1,
  "categoryIds": ["cafes", "restaurants"],
  "provider": "both",
  "persist": true,
  "enrichWebsiteSocials": true
}
```

`provider` is optional (`both` default, or `overture` / `overpass`). Results are enriched with normalized address parts, Maps links, contact score, socials (Overture/OSM + optional website scan), and duplicate marks when sources overlap.

### `GET /api/v1/discovery/searches`

Recent in-process search log (not durable across restarts).

### `GET /api/v1/osm/places` / `GET /api/v1/osm/places/:id`

List or fetch persisted OSM places.

### `GET /api/v1/prospects` / `POST /api/v1/prospects` / `GET|PATCH /api/v1/prospects/:id`

Filters: `search`, `status`, `category`, `assignedToId`, pagination.  
Create from `osmPlaceId` (409 if duplicate). PATCH updates commercial fields, status, assignee, notes and writes activities.

### `GET /api/v1/prospects/meta`

Statuses, distinct categories, assignee users.

### `GET|POST /api/v1/campaigns` / `GET|PATCH /api/v1/campaigns/:id`

### `POST /api/v1/campaigns/:id/prospects`

Associate prospect (`409` if already linked). Detail includes stats by status.

### `GET|POST /api/v1/activities`

Timeline notes / status / assignment events.

## Live in Phase 3

### `GET /api/v1/analytics/dashboard`

Real metrics from PostgreSQL (totals, pending, qualified, open/proposal opportunities, WON conversions, breakdowns).

### `GET|POST /api/v1/analyses`

Manual digital-intelligence findings linked to a prospect (`source` defaults to `manual`).

### `GET|POST /api/v1/opportunities` / `PATCH /api/v1/opportunities/:id`

Pipeline opportunities for DGM services.

### `POST /api/v1/exports/prospects`

Body: `{ "format": "csv"|"xlsx", "campaignId?", "category?", "status?" }`  
Returns a file download. Includes provenance for OSM-backed rows.

When Supabase Auth is configured, protected endpoints require a valid session. In local shell mode without Supabase, a local shell user is used.
