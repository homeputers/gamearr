# Makefile for Gamearr project

# Variables
DOCKER_COMPOSE = docker compose -f infra/docker-compose.yml

# Create a symlink to .env file in the infra directory
.PHONY: ensure-env-link
ensure-env-link:
	@if [ ! -L infra/.env ] || [ ! -e infra/.env ]; then \
		ln -sf "$(PWD)/.env" "$(PWD)/infra/.env"; \
	fi

# Docker commands
.PHONY: docker-up
docker-up: ensure-env-link
	$(DOCKER_COMPOSE) up -d

.PHONY: docker-down
docker-down: ensure-env-link
	$(DOCKER_COMPOSE) down

.PHONY: docker-restart
docker-restart: docker-down docker-up

.PHONY: docker-logs
docker-logs: ensure-env-link
	$(DOCKER_COMPOSE) logs -f

.PHONY: docker-ps
docker-ps: ensure-env-link
	$(DOCKER_COMPOSE) ps

# Database commands
.PHONY: db-migrate
db-migrate:
	pnpm -w storage-generate
	pnpm --filter @gamearr/storage exec prisma migrate dev

.PHONY: db-studio
db-studio:
	pnpm --filter @gamearr/storage exec prisma studio

# Development commands
.PHONY: dev
dev:
	pnpm -w dev

.PHONY: build
build:
	pnpm -w build

# Help command
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  docker-up      - Start all containers"
	@echo "  docker-down    - Stop all containers"
	@echo "  docker-restart - Restart all containers"
	@echo "  docker-logs    - View container logs"
	@echo "  docker-ps      - List running containers"
	@echo "  db-migrate     - Run database migrations"
	@echo "  db-studio      - Open Prisma Studio"
	@echo "  dev            - Start development servers"
	@echo "  build          - Build the project"
	@echo "  help           - Show this help message"
