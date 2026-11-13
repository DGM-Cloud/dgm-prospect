# Docker

Root `docker-compose.yml` runs PostgreSQL 16 with PostGIS 3.4 for local development.

```bash
docker compose up -d db
docker compose ps
docker compose logs -f db
```

Default credentials (local only):

- user: `dgm`
- password: `dgm_prospect_local`
- database: `dgm_prospect`
- port: `5432`
