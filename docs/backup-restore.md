# Backup & Restore

Persistent data lives in the `data/`, `lib/`, and `downloads/` directories and in the Postgres database.

## Backup

1. Dump the database:
   ```bash
   docker compose -f infra/docker-compose.yml exec postgres pg_dump -U gamearr gamearr > backup.sql
   ```
2. Archive persistent directories:
   ```bash
   tar czf data.tar.gz data lib downloads
   ```

## Restore

1. Restore directories:
   ```bash
   tar xzf data.tar.gz
   ```
2. Restore the database:
   ```bash
   cat backup.sql | docker compose -f infra/docker-compose.yml exec -T postgres psql -U gamearr gamearr
   ```
