# SmartServe API (NestJS + TypeORM + PostgreSQL)

Architecture and compatibility: [refactoring walkthrough (Russian)](docs/backend-refactoring-ru.md),
[current HTTP/WebSocket contracts](docs/contracts.md),
[verification report and file list](docs/refactoring-report.md).

## Quick start

### 1. PostgreSQL

```bash
cd api
docker compose up -d
```

Postgres listens on **localhost:5434** (not 5432) to avoid conflict with a local PostgreSQL install on Mac.

### 2. Environment

Copy `.env.example` to `.env` and configure your local database and JWT secret.
Set `CORS_ORIGIN` to the actual frontend origin.

### 3. Run API

```bash
npm install
npm run start:dev
```

API: http://localhost:8000

### 4. Frontend

From `app/`:

```bash
npm run dev
```

Ensure `app/.env.local` contains:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## HTTP and WebSocket API

The active backend uses JWT-authenticated staff accounts with roles/permissions,
and dining sessions for guests. Staff requests use `Authorization: Bearer <token>`;
guest requests use `x-session-token`.

Main features: setup, registration/login, profile, staff, roles, tables, sessions,
categories, sauces, products/menu, basket items, orders, venue settings and images.
Socket.IO namespaces are `orders`, `sessions` and `waiter`.
See the [contract matrix](docs/contracts.md) for routes and payloads.

## Verification

```bash
npm test
npm run build
```

Tests use mocked persistence. HTTP contract tests temporarily bind to
`127.0.0.1` on an available port and close the server after the suite.

## Production

TypeORM uses `synchronize: false`; `DB_SYNC` does not enable synchronization.
Committed migrations run at API startup unless `DB_MIGRATIONS_RUN=false`.
The CLI supports `npm run migration:run`. `DATABASE_URL`, when set, takes
precedence over the individual database connection variables.
