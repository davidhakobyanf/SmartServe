# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

SmartServe is a restaurant ordering system in two parts:

- **`api/`** — NestJS 10 + TypeORM + PostgreSQL backend (`smartserve-api`), listens on port 8000.
- **`app/`** — Next.js 15 (App Router) + React 19 frontend (`smartserve-web`), runs on port 3000. Uses Ant Design and MUI.

The two are separate npm workspaces with their own `package.json`; there is no root-level package manager.

## Commands

Backend (`cd api`):
- `npm run start:dev` — run API with watch/reload
- `npm run build` — compile to `dist/`
- `npm run start:prod` — run compiled build (`node dist/main`)
- No test runner or linter is configured in `api`.

Frontend (`cd app`):
- `npm run dev` — Next.js dev server
- `npm run build` / `npm run start` — production build / serve
- `npm run lint` — ESLint (next lint)
- `npm run api` — convenience alias that runs `npm run start:dev` in `../api`

Setup: copy `api/.env.example` → `api/.env` and `app/.env.local.example` → `app/.env.local`. The API needs a running Postgres (defaults: `localhost:5434`, db/user/pass all `smartserve`). For local dev set `DB_SYNC=true` so TypeORM auto-creates tables — there are **no migrations**. There is no Docker setup in the repo.

## Architecture

### Single-active-user model (important and non-obvious)
There is **no per-request authentication or authorization**. JWTs are minted on register but never verified, and no controller uses a guard. Instead the system tracks one global "active user" (the restaurant owner) in the `session_profile` table — a singleton row with `id = 1` holding the last-logged-in `userId`. Login (`UsersService.login` / `setActiveUser`) overwrites this row. Menu/profile operations call `UsersService.getActiveUser()` to find whose data to mutate. The app is effectively single-tenant at a time.

### Data storage is JSONB-heavy
Most domain data lives in `jsonb` columns rather than relational tables (`api/src/entities/`):
- `users.cards` — a user's full menu (`MenuCard[]`), including base64 image bytes inline.
- `basket_store` — singleton row (`id = 1`); `tables` is `Record<table, MenuCard[]>` (all carts keyed by table number).
- `order_store` — singleton row (`id = 1`); `orders` is `OrderRecord[]` (all placed orders).

The shared shapes (`MenuCard`, `BasketTables`, `OrderRecord`) are defined in `api/src/common/types/menu-card.ts`. When returning cards, strip inline image bytes with `sanitizeMenuCards` (`common/utils/menu-card-response.util.ts`) — clients fetch images separately via `GET /api/menu-images/:cardId`, which streams the stored bytes.

### Real-time via Socket.IO + internal event bus
The API uses `@nestjs/event-emitter` to decouple services from WebSocket gateways. A service mutates data, then emits a domain event (e.g. `DOMAIN_EVENTS.MENU_CHANGED`, `orders:changed`); the matching gateway's `@OnEvent` handler broadcasts a client-facing event over Socket.IO. Three namespaces:
- `menu` — broadcasts `menu:updated` to everyone when the active menu changes.
- `orders` — clients `join` as `admin` (joins `admin` room) or `client` (joins `table:<n>`); admins get `orders:updated`.
- `waiter` — clients `call` for service; admins in the `admin` room receive `waiter:called`. Stateless, no DB.

Each feature module is self-contained (`api/src/<feature>/`: controller(s), service, optional gateway, `dto/`). All HTTP routes are prefixed `api/...` and declared per-controller (no global prefix). A global `ValidationPipe` (whitelist + transform) is set in `main.ts`, so all input goes through `class-validator` DTOs.

### Frontend data flow
- API base URL comes from `NEXT_PUBLIC_API_URL` (`app/src/lib/apiUrl.ts`); all HTTP goes through the axios singleton in `app/src/api/api.ts`.
- React Contexts (`app/src/context/`) own shared state: `OrdersContext` and `WaiterCallsContext` each open a Socket.IO connection (via `lib/ws/socket.ts`) and join as `admin`. These providers wrap the authenticated area in `app/profile/layout.tsx`.
- Auth on the frontend is just a `localStorage` `isLoggedIn` flag; `profile/layout.tsx` redirects to `/` if absent.
- Routes: `/` (login/landing), `/profile/dashboard` (owner menu management), `/client` and `/client/[clientId]` (customer ordering by table).

### Legacy code — do not edit
`app/src/api_node/` is the original Express + Mongoose backend, kept only for reference (`npm run api:legacy`). Its `node_modules/` is committed to git. The NestJS `api/` is the live backend; new work goes there.
