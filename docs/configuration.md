# Configuration

The project uses a handful of environment variables for core services. Copy `.env.example` to `.env` and provide values for the following keys:

| Variable | Description |
| --- | --- |
| `POSTGRES_PASSWORD` | Password for the local Postgres instance. |
| `DB_URL` | Connection string used by the API. |
| `DATABASE_URL` | Alias of `DB_URL` for Prisma and other database clients. |
| `REDIS_URL` | Redis instance used for queues and caching. |
| `LIB_ROOT` | Path where processed games are stored. |
| `DOWNLOADS_ROOT` | Directory for temporary downloads and settings file. |
| `DATA_ROOT` | Persistent data directory for services. |
| `LOG_LEVEL` | Logging verbosity for all services (default: debug in development, info in production). |
| `MAX_DAT_UPLOAD_MB` | Maximum allowed DAT upload size in megabytes (default: 512). |
| `DAT_PRUNE_KEEP` | Number of inactive DATs to retain per platform (default: 2). |
| `AUTH_TOKEN` | When set, required as a Bearer token for mutating API routes and downloads. |
| `FRONTEND_URL` | Origin allowed for browser requests (default: http://localhost:5173). |

Provider API keys and download client credentials are configured via the Settings page and stored in the settings file.

No-Intro DAT URLs are configured per platform in the database rather than via environment variables.
