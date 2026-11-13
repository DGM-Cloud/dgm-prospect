# DGM Prospect

Plataforma interna de DGM CLOUD para prospección comercial y descubrimiento geográfico de negocios.

Arquitectura: **Next.js Full Stack Modular Monolith** (App Router + Route Handlers + Prisma/PostGIS + Supabase Auth).

## Requisitos

- Node.js >= 20
- pnpm 9+
- Docker Desktop (PostgreSQL + PostGIS local)
- Proyecto Supabase (Auth) — opcional para arrancar UI; obligatorio para login real

## Instalación

```bash
pnpm install
cp .env.example .env
```

Completa en `.env`:

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Postgres local (valor de ejemplo en `.env.example`) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (pública) |
| `SUPABASE_JWT_SECRET` | JWT secret (solo servidor) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |

No inventes credenciales: créalas en el dashboard de Supabase.

## Base de datos (Docker)

```bash
docker compose up -d db
pnpm db:migrate:deploy
pnpm db:seed
```

## Desarrollo

```bash
pnpm dev
```

- App: http://localhost:3000
- Health: http://localhost:3000/api/v1/health
- Login: http://localhost:3000/login

## Scripts

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Next.js (Turbopack) |
| `pnpm build` / `pnpm start` | Producción local |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript estricto |
| `pnpm test` | Vitest |
| `pnpm db:migrate` | Migraciones (dev) |
| `pnpm db:migrate:deploy` | Migraciones (deploy/CI) |
| `pnpm db:seed` | Verifica PostGIS / seed documentado |
| `pnpm db:studio` | Prisma Studio |

## Estructura

```
src/
  app/                 # Rutas UI + /api/v1
  modules/             # Dominio (services + repositories)
  infrastructure/      # Prisma, OSM port, queue port, workers
  shared/              # UI, schemas Zod, tipos, config categorías
  lib/                 # env, supabase clients
prisma/                # schema + migraciones SQL (PostGIS)
docs/                  # Arquitectura, API, seguridad, roadmap
```

## Documentación

- [Architecture](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [API](docs/API.md)
- [OSM Integration](docs/OSM-INTEGRATION.md)
- [Security](docs/SECURITY.md)
- [Roadmap](docs/ROADMAP.md)

## Despliegue

Una sola app Next.js (Netlify, Vercel o VPS) + PostgreSQL/PostGIS + Supabase Auth. Workers asíncronos (BullMQ/Redis) son opcionales y posteriores.

## Fases

1. **FASE 0** — Fundamentos (actual)
2. **FASE 1** — Business Explorer + Overpass
3. **FASE 2** — Prospectos y campañas
4. **FASE 3** — Inteligencia comercial y exportaciones
