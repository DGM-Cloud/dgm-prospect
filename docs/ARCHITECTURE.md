# Architecture — DGM Prospect

## Overview

DGM Prospect is a **Next.js Full Stack Modular Monolith** for internal B2B prospecting at DGM CLOUD.

- Single deployable Next.js application (App Router)
- Server-side business logic in `src/modules/*`
- Infrastructure adapters in `src/infrastructure/*`
- UI in `src/app` and `src/shared/components`
- PostgreSQL + PostGIS via Prisma
- Supabase Auth for identity
- Optional future workers (Redis / BullMQ / Node / Python) behind a `JobQueue` port

NestJS and multi-app monorepos are **out of scope**.

## Layering

```
UI (Server/Client Components)
  → Route Handlers / Server Actions
    → modules/*/services
      → modules/*/repositories
      → infrastructure/* providers
```

Rules:

1. React components never import Prisma.
2. Route Handlers stay thin — validate input, call a service, return JSON.
3. Modules must not create circular dependencies.
4. External systems (OSM, geocoding, storage, queue) go through provider interfaces.

## Module map

| Module | Responsibility |
|--------|----------------|
| `identity` | Session, roles, auth guards |
| `users` | Local user profile synced from Supabase |
| `discovery` | Geographic search orchestration |
| `businesses` | OSM place persistence / normalization |
| `prospects` | Commercial prospect portfolio |
| `campaigns` | Campaign grouping |
| `digital-intelligence` | Web/social research (future) |
| `lead-scoring` | Scoring (future) |
| `crm` / `pipeline` / `activities` | Commercial workflow |
| `market-intelligence` / `analytics` / `reporting` | Insights & exports |

## Async work (future)

`src/infrastructure/queue` defines `JobQueue`. Phase 0 ships an explicit **unconfigured** implementation that throws `JobQueueNotConfiguredError`. When Redis + BullMQ are added, swap the adapter without rewriting domain services.

Workers live under `src/infrastructure/workers` and may run as separate Node/Python processes on the same VPS.

## Deployment target

| Piece | Host |
|-------|------|
| Next.js app | Netlify, Vercel, or VPS |
| PostgreSQL + PostGIS | Docker (local) / Supabase or managed PostGIS (prod) |
| Auth | Supabase Auth |
| Workers (later) | Same VPS or separate process |

## Phase boundaries

- **Phase 0**: foundations (this document’s baseline)
- **Phase 1**: Business Explorer + Overpass / Overture Places
- **Phase 2**: Prospect & campaign management
- **Phase 3**: Commercial intelligence, dashboard metrics, exports
