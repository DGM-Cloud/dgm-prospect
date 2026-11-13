# Security — DGM Prospect

## Authentication

- Supabase Auth (email/password) for sign-in
- Session cookies managed via `@supabase/ssr`
- Middleware protects dashboard routes
- `GET /api/v1/auth/me` and future data APIs require a valid server-validated session

Never trust UI-only checks. Roles are enforced in `modules/identity` services.

## Roles

| Role | Access |
|------|--------|
| `ADMIN` | Full access, user management |
| `MANAGER` | Campaigns, prospects, assignments |
| `MEMBER` | Prospect work within granted scope |

## Secrets

- `.env` is gitignored
- `.env.example` documents required keys without real credentials
- `SUPABASE_JWT_SECRET` and `DATABASE_URL` are **server-only**
- Only `NEXT_PUBLIC_*` values may reach the browser
- Never expose Supabase `service_role` to the client

## Data access

- Prisma is restricted to repositories / server code
- Inputs validated with Zod where forms/APIs accept data
- Future rate limiting and stricter CORS apply at the edge/host when deployed

## OSM ethics

Do not scrape proprietary map products. Use Overpass with conservative concurrency and caching.
