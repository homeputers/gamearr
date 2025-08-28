# Local Development

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)
- [Docker Compose](https://docs.docker.com/compose/)

## Setup

1. Copy `.env.example` to `.env` and adjust values as needed.
2. Start the infrastructure services:
   ```bash
   pnpm dev:infra
   ```
3. Install dependencies:
   ```bash
   pnpm -w install
   ```
4. Run all apps:
   ```bash
   pnpm -w dev
   ```

Individual apps can be started with `pnpm dev:api`, `pnpm dev:worker`, or `pnpm dev:web`.
