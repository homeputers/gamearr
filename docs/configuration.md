# Configuration

The project uses a handful of environment variables for core services. Copy `.env.example` to `.env` and provide values for the following keys:

| Variable | Description |
| --- | --- |
| `POSTGRES_PASSWORD` | Password for the local Postgres instance. |
| `DB_URL` | Connection string used by the API and Prisma client. |
| `REDIS_URL` | Redis instance used for queues and caching. |
| `LIB_ROOT` | Path where processed games are stored. |
| `DOWNLOADS_ROOT` | Directory for temporary downloads and settings file. |
| `DATA_ROOT` | Persistent data directory for services. |

Provider API keys and download client credentials are configured via the Settings page and stored in the settings file.

No-Intro DAT URLs are configured per platform in the database rather than via environment variables.
