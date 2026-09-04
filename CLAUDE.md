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
- `npm test` / `npm run test:watch` / `npm run test:cov` — Jest (there are unit specs, e.g. `common/guards/permissions.guard.spec.ts`)
- Migrations (TypeORM CLI against `src/database/data-source.ts`):
  - `npm run migration:generate -- src/migrations/<Name>` — generate from entity diff
  - `npm run migration:run` — apply pending migrations
  - `npm run migration:revert` — roll back the last migration
- No linter is configured in `api`.

Frontend (`cd app`):
- `npm run dev` — Next.js dev server
- `npm run build` / `npm run start` — production build / serve
- `npm run lint` — ESLint (next lint)
- `npm run api` — convenience alias that runs `npm run start:dev` in `../api`

Setup: copy `api/.env.example` → `api/.env` and `app/.env.local.example` → `app/.env.local`. The API needs a running Postgres (`.env.example` defaults: `localhost:5434`, db/user/pass all `smartserve`). There is no Docker setup in the repo.

### Schema is migration-managed (important — CLAUDE-relevant)
TypeORM `synchronize` is **hardcoded `false`** (`app.module.ts`, `database/data-source.ts`) — the schema is **never** auto-created from entities. Instead, committed migrations in `api/src/migrations/` run on API startup when `DB_MIGRATIONS_RUN=true` (the default; see `app.module.ts` → `migrationsRun`). The applied-migrations table is `typeorm_migrations`. The `DB_SYNC` var in `.env.example` is **dead — it is not read anywhere in the code**; do not rely on it. To change the schema: edit entities, then `npm run migration:generate`, review the SQL, and let it run (or `npm run migration:run`).

Current migrations (chronological): `1788425747532-InitialSchema`, `1788437265802-AddPricedSauces`, `1788550000000-AddContentTranslations`.

First-run bootstrap: there is no seed script. `POST /api/setup` (`SetupService`) creates the singleton **Owner** role (all permissions, `isSystem: true`) plus the owner user in one transaction, and refuses to run once any user/role exists.

## Architecture

### Authentication & authorization (real, guard-based)
Two independent access models, both enforced by guards:

- **Staff / admin** — `JwtAuthGuard` (`common/guards/jwt-auth.guard.ts`) verifies a `Bearer` JWT (`JWT_SECRET`, `JWT_EXPIRES_IN`), loads the `User`, and rejects non-`ACTIVE` users. `PermissionsGuard` + the `@RequirePermissions(Permission.X)` decorator then check the effective permission set. Effective permissions = the user's role `permissions`, plus `user.permissionAllow`, minus `user.permissionDeny`. The `Permission` enum lives in `common/auth/permission.ts` (e.g. `PRODUCTS_MANAGE`, `ORDERS_VIEW`, `ROLES_MANAGE`).
- **Guest / diner** — `OpenSessionGuard` (`common/guards/open-session.guard.ts`) reads an `x-session-token` header (a dining session UUID), asserts the session is still `open`, and attaches it as `req.diningSession`. This gates the customer ordering/basket endpoints. Closing the bill closes the session and revokes the token.

There is **no** global "active user" and **no** `session_profile` table — that model is gone.

### Relational data model
Domain data lives in real relational tables (`api/src/entities/`), not JSONB singletons. See the ER overview in `docs/` / the DBML below. Key entities:
- `users` ↔ `roles` (many-to-one; role carries a permission list + a `code`).
- `categories` 1—* `products` *—* `sauces` (join table `product_sauces`).
- `tables` 1—* `dining_sessions` (partial unique index: one **open** session per table) 1—* `basket_items` and 1—* `orders` 1—* `order_items`.
- `venue_settings` — singleton config row (`id = 1`, smallint): venue name, currency, timezone.

JSONB is used only for **value objects**, not as a data lake: `roles.permissions` / `users.permissionAllow` / `users.permissionDeny` (permission arrays), the `*Translations` localization columns (below), and `basket_items.sauces` / `order_items.sauces` (frozen `SauceSnapshot[]`). Order items also freeze `titleSnapshot` / `descriptionSnapshot` so a placed order is immune to later menu edits. Product image bytes are stored as `bytea` in `products.imageData` (`select: false`); clients fetch them separately via `GET /api/products/:id/image`.

### Content localization (en / am / ru)
User-authored content names are translatable. Each such entity has a `*Translations` `jsonb` column holding a `LocalizedText` (`Partial<Record<'en'|'am'|'ru', string>>`), alongside the legacy scalar (`name`/`title`/`description`) kept as a fallback/primary:
- `categories.nameTranslations`, `sauces.nameTranslations`, `roles.nameTranslations`, `tables.nameTranslations`, `products.titleTranslations`, `products.descriptionTranslations`.

Shared helpers live in `api/src/common/i18n/` (`localized-text.ts`, `localized-text.dto.ts`, `localized-response.ts`). Controllers read the `Accept-Language` header and resolve the display string with `resolveLocalizedText` / `localizedNameResponse` before responding; services persist via `cleanLocalizedText` / `withLegacyEnglish`. Some read paths (orders, guest basket) return the raw `*Translations` payload and let the **client** resolve the language in `app/src/lib/normalizeMenuCard.ts` — that is intentional, not a bug. `'hy'` maps to `'am'`.

### Real-time via Socket.IO + internal event bus
The API uses `@nestjs/event-emitter` to decouple services from WebSocket gateways. A service mutates data, then emits a domain event (e.g. `ORDER_DOMAIN_EVENTS.CHANGED`, `SESSION_DOMAIN_EVENTS.BASKET_CHANGED` / `CLOSED`); the matching gateway's `@OnEvent` handler broadcasts a client-facing event over Socket.IO. Three namespaces (each defines `WS_NAMESPACE` / `WS_EVENTS` / `WS_ROOMS` in its gateway file):
- `orders` — clients `join` as `admin` (→ `admin` room, gets financials) or `client` (→ `table:<n>`); both receive `orders:updated` (`ordersResponse`, financials only for admins).
- `sessions` — diners `join` a session; broadcasts `basket:updated` on basket change and `session:closed` when the bill is closed.
- `waiter` — clients `call` for service; admins in the `admin` room receive `waiter:called`. Stateless, no DB.

Each feature module is self-contained (`api/src/<feature>/`: controller(s), service, optional gateway, `dto/`). All HTTP routes are prefixed `api/...` and declared per-controller (no global prefix). A global `ValidationPipe` (whitelist + transform + implicit conversion) is set in `main.ts`, so all input goes through `class-validator` DTOs. CORS origin is `CORS_ORIGIN` (default `http://localhost:3001`); body limit is 15 MB (for base64 image uploads).

### Frontend data flow
- API base URL comes from `NEXT_PUBLIC_API_URL` (`app/src/lib/apiUrl.ts`); all HTTP goes through the axios singleton in `app/src/api/api.ts`, which attaches the JWT and sets `Accept-Language` from the active locale.
- Internationalization uses **next-intl** with locale-prefixed routing under `app/src/app/[locale]/…` (locales `en`, `ru`, `am` — note `am` = Armenian). UI strings live in `app/src/messages/<locale>/*.json`; keep keys identical across all three locales. Content translations (menu/table/role names) are edited via the shared `components/Common/LocalizedTextFields.tsx` (three language tabs) and resolved for display in `lib/normalizeMenuCard.ts`.
- React Contexts (`app/src/context/`) own shared real-time state and open Socket.IO connections (via `lib/ws/socket.ts`). Providers wrap the authenticated area under `app/[locale]/profile/…`.
- Routes (under `/[locale]`): `/` (login/landing), `/profile/{dashboard,menu,orders,tables,staff,waiter,settings,account}` (admin), `/client` and `/t/[table]` (customer ordering by table QR).

### Legacy code — do not edit
`app/src/api_node/` is the original Express + Mongoose backend, kept only for reference (`npm run api:legacy`). Its `node_modules/` is committed to git. The NestJS `api/` is the live backend; new work goes there.
