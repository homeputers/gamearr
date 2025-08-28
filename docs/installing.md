# Installing

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)
- [Docker Compose](https://docs.docker.com/compose/)

## Steps

1. Clone the repository and change into its directory.
2. Copy `.env.example` to `.env` and set values.
3. Install dependencies:
   ```bash
   pnpm -w install
   ```
4. Start supporting services:
   ```bash
   pnpm dev:infra
   ```
5. Run database migrations:
   ```bash
   pnpm migrate
   ```
6. Build the apps:
   ```bash
   pnpm -w build
   ```

The built artifacts reside in each app's `dist/` folder. Start the API or worker using Node or a process manager of your choice.
