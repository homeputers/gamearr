FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps ./apps

RUN corepack enable \
    && pnpm install \
    && pnpm --filter @gamearr/worker build

CMD ["node", "apps/worker/dist/main.js"]
