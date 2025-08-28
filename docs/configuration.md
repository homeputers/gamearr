# Configuration

The project is configured through environment variables. Copy `.env.example` to `.env` and provide values for the following keys:

| Variable | Description |
| --- | --- |
| `POSTGRES_PASSWORD` | Password for the local Postgres instance. |
| `DB_URL` | Connection string used by the API and Prisma client. |
| `REDIS_URL` | Redis instance used for queues and caching. |
| `RAWG_KEY` | API key for the RAWG game database. |
| `IGDB_CLIENT_ID` | IGDB client identifier. |
| `IGDB_CLIENT_SECRET` | IGDB client secret. |
| `LIB_ROOT` | Path where processed games are stored. |
| `DOWNLOADS_ROOT` | Directory for temporary downloads. |
| `DATA_ROOT` | Persistent data directory for services. |
| `QBITTORRENT_URL` | URL of the qBittorrent client. |
| `QBITTORRENT_USERNAME` | qBittorrent username. |
| `QBITTORRENT_PASSWORD` | qBittorrent password. |
| `NOINTRO_DAT_URL` | URL to the No-Intro DAT file. |
| `NOINTRO_PLATFORM_ID` | No-Intro identifier for the target platform. |
