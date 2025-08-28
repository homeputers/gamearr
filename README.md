# gamearr

[![CI](https://github.com/homeputers/gamearr/actions/workflows/ci.yml/badge.svg)](https://github.com/homeputers/gamearr/actions/workflows/ci.yml)
[![Docker](https://img.shields.io/docker/pulls/homeputers/gamearr?logo=docker)](https://hub.docker.com/r/homeputers/gamearr)
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

## Documentation

Additional guides and references live in the [docs](./docs) directory.
