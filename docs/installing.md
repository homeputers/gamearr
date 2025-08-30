# Installing

The application is intended to be deployed using Docker images published by our
GitHub Actions pipeline. Prebuilt images are available on Docker Hub under the
`acwilan/gamearr-*` repositories, so you can pull them directly instead of
building locally.

## Prerequisites

- [Docker](https://docs.docker.com/engine/)
- [Docker Compose](https://docs.docker.com/compose/)

## Steps

1. Copy `.env.example` to `.env` and set values for your environment.
2. Pull the Docker images:
   ```bash
   docker pull acwilan/gamearr-api:latest
   docker pull acwilan/gamearr-worker:latest
   docker pull acwilan/gamearr-web:latest
   ```
3. Start the stack:
   ```bash
   docker compose -f docker-compose.app.yml up -d
   ```
   The command launches the API, worker, and web services using the pulled
   images.

