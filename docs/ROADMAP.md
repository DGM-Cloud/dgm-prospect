# Roadmap — DGM Prospect

## Phase 0 — Foundations

- [x] Next.js App Router modular monolith
- [x] PostgreSQL + PostGIS + Prisma schema/migrations
- [x] Supabase Auth shell + role model
- [x] Dashboard layout + empty module pages
- [x] Health + auth/me API routes
- [x] JobQueue port (unconfigured) for future workers
- [x] Documentation

## Phase 1 — Business Explorer

- [x] Leaflet map + radius + categories
- [x] OverpassProvider (real queries, normalize, cache, timeouts)
- [x] OvertureProvider (Places GeoParquet via DuckDB, default discovery source)
- [x] Results table + detail panel
- [x] Persist `osm_places`
- [x] Save as prospect (dedupe by `osmPlaceId`)

## Phase 2 — Prospect management

- [x] Paginated prospects, filters, assignment
- [x] Campaigns + campaign-prospect links
- [x] Notes & activity log
- [x] Status workflow

## Phase 3 — Commercial intelligence (current)

- [x] Manual digital findings + opportunity logging (no fake scraping)
- [x] Opportunities + dashboard metrics from real data
- [x] XLSX / CSV exports
- [ ] Redis + BullMQ workers (when batch analysis is justified)

## Explicit non-goals for early phases

- NestJS / separate API app
- Microservices
- Payment providers
- Fake dashboard numbers
