# SmartServe API (NestJS + TypeORM + PostgreSQL)

## Quick start

### 1. PostgreSQL

```bash
cd api
docker compose up -d
```

Postgres listens on **localhost:5434** (not 5432) to avoid conflict with a local PostgreSQL install on Mac.

### 2. Environment

Copy `.env.example` to `.env` (or use the included `.env` for local Docker).

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

## Endpoints (same as legacy Express)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/register` | Register admin |
| POST | `/api/user/login` | Login + menu session |
| GET | `/api/profile` | Active profile + menu cards |
| PATCH/PUT/DELETE | `/api/user/login` | Menu CRUD |
| GET/PATCH/DELETE | `/api/basket` | Basket by table |
| DELETE | `/api/basket/all` | Clear table basket |
| GET/PATCH/DELETE | `/api/orders` | Orders |
| DELETE | `/api/orders/all` | Clear all orders |

## Production

Set `DB_SYNC=false` and use TypeORM migrations before deploy.
