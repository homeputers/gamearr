FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps ./apps

RUN corepack enable \
    && pnpm install \
    && pnpm --filter @gamearr/web build

EXPOSE 5173
CMD ["pnpm", "--filter", "@gamearr/web", "exec", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
