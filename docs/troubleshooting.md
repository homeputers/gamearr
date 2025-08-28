# Troubleshooting

## Services fail to start
- Ensure Docker is running and infrastructure services are up: `pnpm dev:infra`.
- Check container status with:
  ```bash
  docker compose -f infra/docker-compose.yml ps
  ```

## Database connection errors
- Verify `DB_URL` and that migrations have been applied: `pnpm migrate`.

## Prisma client missing
- Regenerate the client:
  ```bash
  pnpm storage-generate
  ```

## Port already in use
- Stop the process using the port or change the configuration in `.env`.

## Getting more logs
- Inspect application logs or run containers in the foreground:
  ```bash
  docker compose -f infra/docker-compose.yml logs -f
  ```
