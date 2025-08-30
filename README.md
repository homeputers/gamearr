# gamearr

[![CI](https://github.com/homeputers/gamearr/actions/workflows/ci.yml/badge.svg)](https://github.com/homeputers/gamearr/actions/workflows/ci.yml)
[![Docker API](https://img.shields.io/docker/pulls/acwilan/gamearr-api?logo=docker)](https://hub.docker.com/r/acwilan/gamearr-api)
[![Docker Worker](https://img.shields.io/docker/pulls/acwilan/gamearr-worker?logo=docker)](https://hub.docker.com/r/acwilan/gamearr-worker)
[![Docker Web](https://img.shields.io/docker/pulls/acwilan/gamearr-web?logo=docker)](https://hub.docker.com/r/acwilan/gamearr-web)
[![Docs](https://img.shields.io/badge/docs-available-blue.svg)](./docs)

Monorepo managed with [Turborepo](https://turbo.build/) and [pnpm](https://pnpm.io/).

## Usage Disclaimer

gamearr does not provide game files. Use this project only with backups of
games you legally own. You are responsible for complying with the terms of
service for any providers you access through this software.

## Workspaces

- `apps/api` – NestJS API server
- `apps/worker` – background worker built with Nest
- `apps/web` – React app bootstrapped with Vite and TypeScript
- `packages/domain` – shared domain logic in TypeScript
- `packages/adapters` – provider and download clients
- `packages/storage` – Prisma client and migrations
- `packages/shared` – zod schemas, logger, and config utilities

## Infrastructure

> Requires [Docker Compose](https://docs.docker.com/compose/install/) to be installed.

Copy `.env.example` to `.env` and set the `POSTGRES_PASSWORD` value. Then start the supporting services:

```bash
docker compose -f infra/docker-compose.yml up -d
```

Data is persisted to the `data/` directory.

## Development

```bash
pnpm -w install
pnpm -w dev
```

## Build

```bash
pnpm -w build
```

## Release

1. Ensure all changes have an associated changeset.
2. Run the changelog task to apply version bumps and regenerate `CHANGELOG.md`:

   ```bash
   make changelog
   ```

3. Commit the result and create a tag:

   ```bash
   git commit -am "chore(release): vX.Y.Z"
   git tag vX.Y.Z
   git push origin --tags
   ```

The release workflow builds and publishes artifacts for the tagged version.

## Documentation

Additional guides and references live in the [docs](./docs) directory.
