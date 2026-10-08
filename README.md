# E-Commerce Platform - API + Admin + Storefront Monorepo

Learning and self building: a **NestJS API** plus **two Next.js (App Router) applications** - a
back-office **admin** app and a customer **storefront**. The API owns the business rules and is the
only process that opens a database connection; both Next apps are BFFs that call it over REST.
Managed as a **pnpm + Turborepo monorepo**, built **database-first**.

---

## Contents

- [Overview](#overview)
  - [Rendering models](#rendering-models)
- [Documentation](#documentation)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Quick start (run the three services)](#quick-start-run-the-three-services)
- [Database setup](#database-setup)
  - [1. Start PostgreSQL with Docker](#1-start-postgresql-with-docker)
  - [2. Connect with DBeaver](#2-connect-with-dbeaver)
  - [3. Create the schema](#3-create-the-schema)
  - [4. Seed data](#4-seed-data)
  - [5. Generate the Prisma client](#5-generate-the-prisma-client)
  - [6. Verify (smoke test)](#6-verify-smoke-test)
  - [7. Reset / teardown](#7-reset--teardown)
- [Data model](#data-model)
- [Packages](#packages)
  - [`@repo/config` - shared tooling presets](#repoconfig---shared-tooling-presets)
  - [`@repo/contracts` - the shared vocabulary](#repocontracts---the-shared-vocabulary)
  - [`@repo/api-client` - the one way to call the API](#repoapi-client---the-one-way-to-call-the-api)
  - [`@repo/ui` - shared React components](#repoui---shared-react-components)
  - [`@repo/auth` - authentication + RBAC](#repoauth---authentication--rbac)
- [Monorepo \& tooling](#monorepo--tooling)
  - [Why a monorepo](#why-a-monorepo)
  - [Workspaces (pnpm)](#workspaces-pnpm)
  - [Turborepo pipeline](#turborepo-pipeline)
  - [Shared config (`@repo/config`)](#shared-config-repoconfig)
  - [Code-style enforcement (two layers)](#code-style-enforcement-two-layers)
  - [Editor integration (VS Code)](#editor-integration-vs-code)
  - [Reuse in another project](#reuse-in-another-project)
- [Scripts reference](#scripts-reference)

---

## Overview

Three services share code through local packages instead of living in separate repositories that
drift apart:

| Part           | Path                  | Runs on               | Role                                                              |
| -------------- | --------------------- | --------------------- | ----------------------------------------------------------------- |
| API            | `apps/api`            | http://localhost:3002 | NestJS - business rules, RBAC, the only Prisma connection         |
| Admin app      | `apps/admin`          | http://localhost:3001 | Back office - catalog, users, roles/permissions (RBAC)            |
| Storefront app | `apps/client`         | http://localhost:3000 | Customer-facing - browse, filter, search, auth                    |
| Contracts      | `packages/contracts`  | -                     | Zod schemas + DTO types shared by the API and both BFFs           |
| API client     | `packages/api-client` | -                     | `apiFetch` - the server-side way to call the API                  |
| Shared UI      | `packages/ui`         | -                     | React components shared by both apps (`@repo/ui`)                 |
| Shared config  | `packages/config`     | -                     | ESLint / Prettier / tsconfig / Tailwind presets (`@repo/config`)  |
| Auth + RBAC    | `packages/auth`       | -                     | Auth.js v5 (Credentials + JWT) + permission guards (`@repo/auth`) |

Requests flow one way, and the browser never holds an API token:

```
Browser  --httpOnly cookie-->  ADMIN / CLIENT  --Bearer JWT-->  API  --Prisma-->  PostgreSQL
                                (the BFF layer)
```

**Design principles that shape everything here:**

- **Database-first.** Hand-written SQL in `database/` is the source of truth. Prisma is only a
  **generated client** (`prisma db pull`), never the schema owner - there is no `prisma migrate`.
- **One-way dependencies.** `apps/*` may import `packages/*`; packages never import apps.
- **Only the API touches the database.** Prisma lives inside `apps/api`; neither Next app has a
  client to import, and neither needs `DATABASE_URL`.
- **Tooling is centralized.** Lint, format, and TypeScript rules live once in `@repo/config` and are
  consumed everywhere, so nothing drifts.

### Rendering models

The two Next.js apps are both BFFs, but they render in opposite ways because they serve opposite
needs. Knowing which model an app uses is the first thing to establish before changing its code.

|                   | **ADMIN** (back office)           | **CLIENT** (storefront)               |
| ----------------- | --------------------------------- | ------------------------------------- |
| Model             | SPA - data fetched in the browser | Server-first - data fetched on render |
| Who calls the API | Route handlers under `app/api/`   | Server Components and server actions  |
| Browser talks to  | `/api/...` on its own origin      | Nothing - it receives rendered HTML   |
| Data library      | TanStack Query                    | Next's `fetch` (cache + ISR)          |
| Folder layout     | `features/<domain>/`              | `components/` + `lib/`                |
| SEO               | Not needed (sign-in required)     | A requirement                         |
| Server actions    | None                              | Used for auth and account writes      |

Either way the browser holds only an `httpOnly` cookie: the API token stays on the Next server.
ADMIN being a SPA does not weaken that - its browser calls a same-origin route handler, and that
handler is what swaps the cookie for a bearer token.

---

## Documentation

Setup, monorepo and database live in this file. The deeper explanations live in
**[docs/guides/](docs/guides/README.md)**, written in Vietnamese, one question per file.

| Block | Guides                                                                                      |
| ----- | ------------------------------------------------------------------------------------------- |
| `0x`  | Architecture · getting started · shared packages · adding a feature                         |
| `1x`  | API: overview · structure · request lifecycle · data access · authentication · new endpoint |
| `2x`  | ADMIN: overview · structure · data flow · new screen                                        |
| `3x`  | CLIENT: overview · structure · data fetching                                                |

Start at [docs/guides/README.md](docs/guides/README.md) - it lists reading orders by goal
("I want to learn NestJS", "I want to add a feature", "I need to fix a broken admin screen").

---

## Tech stack

| Layer             | Choice                                        |
| ----------------- | --------------------------------------------- |
| Framework         | Next.js 16 (App Router, Turbopack) · React 19 |
| API framework     | NestJS 11 · nestjs-zod · Swagger (OpenAPI)    |
| Language          | TypeScript 5 (strict)                         |
| Styling           | Tailwind CSS v4                               |
| Database          | PostgreSQL 16                                 |
| ORM (client only) | Prisma 6 (introspected via `db pull`)         |
| Monorepo          | pnpm workspaces + Turborepo                   |
| Quality           | ESLint 9 (flat config) · Prettier             |
| Runtime           | Node.js 22 · pnpm 10.33.0                     |

---

## Repository layout

```
nextjs-playground/
├── apps/
│   ├── api/                # NestJS API            → :3002  (Swagger at /api/docs)
│   │   ├── prisma/         #   schema.prisma - the generated client's source
│   │   ├── src/prisma/     #   PrismaService + Prisma error helpers
│   │   └── tests/          #   Vitest
│   ├── admin/              # Next.js back office   → :3001  (SPA: features/ + route handlers)
│   │   └── tests/          #   Vitest + Testing Library
│   └── client/             # Next.js storefront    → :3000  (server-first: components/ + lib/)
│       └── tests/          #   Vitest + Testing Library
├── packages/
│   ├── config/             # shared ESLint / Prettier / tsconfig / Tailwind  (@repo/config)
│   ├── contracts/          # Zod schemas + DTO types shared by API and BFFs (@repo/contracts)
│   ├── api-client/         # apiFetch - the single way to call the API (@repo/api-client)
│   ├── ui/                 # React components shared by both apps (@repo/ui)
│   └── auth/               # Auth.js v5 (Credentials + JWT) + RBAC guards (@repo/auth)
├── database/               # DATABASE-FIRST: the SQL source of truth
│   ├── migrations/         # 001…009 - CREATE TABLE scripts, applied in order
│   └── seed/
│       ├── reference/      # permission catalog - seeded in EVERY environment
│       └── dev/            # baseline roles + a dev admin - LOCAL ONLY
├── docs/
│   ├── guides/             # the technical guides - start at docs/guides/README.md
│   ├── prd/                # product requirement documents
│   └── plans/              # phased implementation plans
├── .vscode/                # editor settings, debug launch configs, extensions
├── package.json            # root scripts + dev tools
├── pnpm-workspace.yaml     # declares workspaces
└── turbo.json              # task pipeline + caching
```

---

## Prerequisites

| Tool           | Version           | Why                                             |
| -------------- | ----------------- | ----------------------------------------------- |
| Node.js        | 22 (see `.nvmrc`) | Runtime                                         |
| pnpm           | 10.33.0           | Package manager - enable with `corepack enable` |
| Docker Desktop | any recent        | Run PostgreSQL locally                          |
| DBeaver        | any recent        | Connect to and inspect the database             |

> Enable pnpm via Corepack (ships with Node): `corepack enable`. This activates the exact pnpm
> version pinned in `package.json`.

---

## Quick start (run the three services)

Every page reads its data through the API, so the database and the API have to be up before the
apps show anything. Start with [Database setup](#database-setup), then:

```bash
corepack enable          # activates the pinned pnpm version
pnpm install             # installs all workspaces
pnpm dev                 # starts the API and BOTH apps
```

- Storefront → **http://localhost:3000**
- Admin → **http://localhost:3001**
- API → **http://localhost:3002** (Swagger at **/api/docs**)

Run a single service with a filter - the API still has to be running for either app to load:

```bash
pnpm --filter api dev        # API only
pnpm --filter admin dev      # admin only
pnpm --filter client dev     # storefront only
```

`pnpm build` needs the API running too: the storefront prerenders its home and product pages at
build time, and those pages fetch.

Before committing, run the same checks CI does:

```bash
pnpm typecheck && pnpm lint && pnpm test
```

A step-by-step version of this guide, in Vietnamese, is in
[docs/guides/01-getting-started.md](docs/guides/01-getting-started.md).

---

## Database setup

The database is **DB-first**: the SQL files in `database/` define the schema and seed data; Prisma
generates a typed client from the live database. You bring your own PostgreSQL - a shared dev
database, or a personal one via Docker (shown below) - and inspect it with **DBeaver**.

### 1. Start PostgreSQL with Docker

Run a Postgres 16 container with a named volume so data survives restarts. One line - works in
PowerShell and bash:

```bash
docker run -d --name ecommerce-postgres \
  -e POSTGRES_USER=app -e POSTGRES_PASSWORD=app -e POSTGRES_DB=ecommerce \
  -p 5432:5432 -v ecommerce_pgdata:/var/lib/postgresql/data postgres:16
```

Verify it is accepting connections:

```bash
docker exec ecommerce-postgres pg_isready -U app -d ecommerce   # -> "accepting connections"
```

### 2. Connect with DBeaver

New Connection → **PostgreSQL**, then:

| Field    | Value       |
| -------- | ----------- |
| Host     | `localhost` |
| Port     | `5432`      |
| Database | `ecommerce` |
| Username | `app`       |
| Password | `app`       |

Test Connection → Finish. (Accept the driver download if DBeaver offers it.)

### 3. Create the schema

Copy the SQL folder into the container once, then apply every migration in numeric order
(**order matters** because of foreign keys). Running `psql` inside the container avoids host-encoding
issues on Windows:

```bash
docker cp database ecommerce-postgres:/tmp/database
docker exec ecommerce-postgres sh -c \
  'for f in /tmp/database/migrations/*.sql; do echo "applying $f"; psql -U app -d ecommerce -v ON_ERROR_STOP=1 -f "$f"; done'
```

> Re-run the `docker cp` line whenever you edit a SQL file, so the container has the latest copy.

**DBeaver alternative:** open each file under `database/migrations/` in a SQL Editor and run it with
**Execute SQL Script** (`Alt+X`), in order `001 → 009`.

You should end up with 9 tables (`users, roles, permissions, user_roles, role_permissions,
categories, brands, products, product_images`) plus the `product_status` enum.

### 4. Seed data

Seeds are split by **where they apply** - every file is idempotent (safe to re-run):

| Folder            | Runs in                                    | Contents                                                                 |
| ----------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| `seed/reference/` | **every** environment (dev, staging, prod) | Permission catalog - the single source of truth, mirrors `packages/auth` |
| `seed/dev/`       | **local development only**                 | Baseline roles, a dev admin, and a demo catalog (8 files)                |

**Local development** - apply reference first, then dev (assumes the `docker cp` from step 3):

```bash
docker exec ecommerce-postgres sh -c \
  'for f in /tmp/database/seed/reference/*.sql /tmp/database/seed/dev/*.sql; do echo "seeding $f"; psql -U app -d ecommerce -v ON_ERROR_STOP=1 -f "$f"; done'
```

**Production** - apply **only** `seed/reference/`. Never run `seed/dev/` there; in production the
first admin is created through a secure, env-driven bootstrap, not committed SQL.

This inserts 8 permissions, 3 roles (`SUPER_ADMIN`, `CATALOG_EDITOR`, `USER_MANAGER`), their
permission links, one admin user, and a demo catalog (categories, brands, products and images) so
both apps have something to render.

**Dev admin credentials** (local only - stored as a bcrypt hash in `seed/dev/02_admin.sql`):

| Email             | Password    | Role          |
| ----------------- | ----------- | ------------- |
| `admin@local.dev` | `Admin123!` | `SUPER_ADMIN` |

### 5. Generate the Prisma client

Prisma reads `apps/api/prisma/schema.prisma` and generates a type-safe client into
`node_modules/@prisma/client`:

```bash
# apps/api/.env must already hold DATABASE_URL - see "Configure environment variables"
pnpm --filter api run db:pull      # = prisma db pull + prisma generate
```

Re-run `db:pull` any time the SQL schema changes. The client is used **only inside the API**,
through `PrismaService`:

```ts
// apps/api/src/products/products.service.ts
constructor(private readonly prisma: PrismaService) {}
```

### 6. Verify (smoke test)

Run this in DBeaver - the admin must resolve to `SUPER_ADMIN` with all 8 permissions:

```sql
SELECT u.email,
       array_agg(DISTINCT r.name)       AS roles,
       count(DISTINCT rp.permission_id) AS permission_count
FROM users u
JOIN user_roles ur       ON ur.user_id = u.id
JOIN roles r             ON r.id = ur.role_id
JOIN role_permissions rp ON rp.role_id = r.id
WHERE u.email = 'admin@local.dev'
GROUP BY u.email;
-- expected: admin@local.dev | {SUPER_ADMIN} | 8
```

Or browse the data with `pnpm --filter api run db:studio`.

### 7. Reset / teardown

```sql
-- Re-run from a clean schema (DBeaver, against the ecommerce database):
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

```bash
docker stop ecommerce-postgres && docker rm ecommerce-postgres   # remove container (keeps data volume)
docker volume rm ecommerce_pgdata                                # DESTRUCTIVE: delete all data
```

---

## Data model

Nine tables. Money is stored as **integer cents**; product visibility is an **enum**; access control
is **dynamic RBAC** (users ↔ roles ↔ permissions).

| Table              | Purpose                 | Key columns                                           |
| ------------------ | ----------------------- | ----------------------------------------------------- |
| `users`            | Accounts                | `email` unique, `password_hash` (bcrypt), `is_active` |
| `roles`            | RBAC roles              | `name` unique (1–60 chars)                            |
| `permissions`      | Permission catalog      | `key` unique (`resource:action`)                      |
| `user_roles`       | User ↔ role (M:N)       | PK `(user_id, role_id)`, cascade delete               |
| `role_permissions` | Role ↔ permission (M:N) | PK `(role_id, permission_id)`, cascade delete         |
| `categories`       | Product categories      | `name` + `slug` unique (kebab-case)                   |
| `brands`           | Product brands          | `name` + `slug` unique (kebab-case)                   |
| `products`         | Catalog                 | integer-cents pricing, `status` enum, FKs `RESTRICT`  |
| `product_images`   | Product images          | FK to `products` (cascade), `position`                |

**Conventions enforced at the database boundary:**

- **Money** is integer **cents** (`price_cents`, `compare_at_price_cents`) - never floats.
- `products.status` is the enum `product_status` = `DRAFT | PUBLISHED | ARCHIVED` (default `DRAFT`).
- `products.category_id` / `brand_id` use **`ON DELETE RESTRICT`** - a referenced category/brand
  cannot be deleted (no orphan foreign keys).
- CHECK constraints encode validation rules (name length, non-negative cents/stock,
  `compare_at_price_cents > price_cents`, kebab-case slugs).

---

## Packages

Shared building blocks under `packages/*`. Services import them by name (`@repo/*`); packages never
import apps. Each is a `workspace:*` dependency.

| Package            | Imported by     | Purpose                                         | Ships   |
| ------------------ | --------------- | ----------------------------------------------- | ------- |
| `@repo/config`     | everything      | ESLint / Prettier / tsconfig / Tailwind presets | source  |
| `@repo/contracts`  | API + both apps | Zod schemas + DTO types for every endpoint      | `dist/` |
| `@repo/api-client` | both apps       | `apiFetch`, `ApiError`, `ApiUnavailableError`   | `dist/` |
| `@repo/ui`         | both apps       | React components shared by admin and storefront | source  |
| `@repo/auth`       | both apps       | Auth.js v5 session + RBAC guards for the BFFs   | source  |

Packages the API consumes are **compiled to `dist/`**, because NestJS builds with `tsc` rather than
a bundler and cannot transpile another package's TypeScript source. Packages only the Next apps
consume ship source and are compiled by the app via `transpilePackages`.

Prisma is deliberately **not** a shared package. It lives in `apps/api/prisma/` (the schema) and
`apps/api/src/prisma/` (`PrismaService` and the error helpers), because the API is the only thing
that may open a database connection - putting it in `packages/*` would advertise it as shareable.

### `@repo/config` - shared tooling presets

Single source of truth for lint/format/TS/Tailwind, consumed via subpath exports:

| Export                            | Consumed by                                                     |
| --------------------------------- | --------------------------------------------------------------- |
| `@repo/config/eslint`             | each app's `eslint.config.mjs` + the root `eslint.config.mjs`   |
| `@repo/config/prettier`           | root `prettier.config.mjs` (re-export) - governs the whole repo |
| `@repo/config/tsconfig`           | every `tsconfig.json` via `"extends"`                           |
| `@repo/config/tailwind/theme.css` | each app's `globals.css` via `@import`                          |

### `@repo/contracts` - the shared vocabulary

One Zod schema per request body and query string, plus the DTO type of every response. The API
turns each schema into a NestJS DTO with `createZodDto`; the apps import the same schema to
validate a form before it leaves the server, and the same DTO type to render the result.

```ts
import { catalogListParamsSchema, type ProductCardDto } from "@repo/contracts";
```

A field only has to change in one place, and a response shape cannot drift from what the caller
expects - it is the same type on both ends.

### `@repo/api-client` - the one way to call the API

```ts
import { apiFetch, ApiError } from "@repo/api-client";

const page = await apiFetch<PageDto<ProductCardDto>>("/products?page=1", { token });
```

Reads the base URL from `API_URL`, attaches the bearer token, applies a 10s timeout, and turns a
non-2xx response into an `ApiError` carrying the status and any field errors. Every call that
leaves for the API goes through it, so timeouts and error shape are decided once.

**Server-side only.** It needs `API_URL` and a token, neither of which exists in the browser. The
admin's browser code calls its own route handlers with axios (`services/api-client.ts`), and those
route handlers are what call `apiFetch`.

### `@repo/ui` - shared React components

Imported by subpath so a bundler can drop what an app does not use:

```ts
import { Button } from "@repo/ui/button";
import { formatMoney } from "@repo/ui/format";
```

Ten primitives (`button` `input` `label` `select` `textarea` `badge` `avatar` `dialog`
`dropdown-menu` `sheet`) plus four helpers: `cn`, `format`, `list-href` and `action-result`.
Nothing here knows about the domain - `ProductCard` lives in the app that owns it.

### `@repo/auth` - authentication + RBAC

Auth.js v5 holds the **session cookie** for each app. It no longer checks the password itself:
`authorize()` posts the credentials to `POST /auth/login`, and the API's JWT is stored inside the
`httpOnly` cookie. The browser never sees that token.

| Export                        | Use                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `handlers`                    | `export const { GET, POST } = handlers` in `app/api/auth/[...nextauth]/route.ts`   |
| `auth()`                      | read the current session in Server Components / route handlers                     |
| `sessionToken()`              | the API token to pass to `apiFetch`                                                |
| `checkSession(session)`       | ask the API whether the session still works: `active` / `inactive` / `unreachable` |
| `requirePermission(key)`      | server guard - throws `ForbiddenError` (403) when the session lacks `key`          |
| `hasPermission(session, key)` | boolean check (UX-level)                                                           |
| `PERMISSIONS` / `Permission`  | permission catalog, re-exported from `@repo/contracts`                             |

`checkSession` returns three states, not two: a deactivated account and an unreachable API look
identical from the client but need opposite responses - one needs an administrator, the other just
needs time. `isSessionActive` is still exported but `@deprecated`, because it collapses the two.

The guard here decides **what to render**; the API decides **what is allowed**. The API re-reads
the account and its permissions from the database on every request, so a deactivated account is
refused on its very next call even while its cookie is still valid.

```ts
// apps/admin - a route handler swaps the session cookie for a bearer token
import { sessionToken } from "@repo/auth";
import { ApiError, apiFetch } from "@repo/api-client";

export async function callApi<T>(path: string, method: Method = "GET", body?: unknown): Promise<T> {
  const token = await sessionToken();
  if (!token) throw new ApiError(401, "Sign in to continue.");
  return apiFetch<T>(path, { method, body, token });
}
```

ADMIN uses no server actions at all - every write goes through a route handler. CLIENT, being
server-first, does use them for auth and account writes.

- **Config:** each app needs `AUTH_SECRET`, `AUTH_COOKIE_PREFIX` and `API_URL` (copy
  `apps/<app>/.env.example` → `.env.local`; generate the secret with `npx auth secret`), sets
  `transpilePackages: ["@repo/auth", "@repo/ui"]`, and wires the route above. `next`/`react` are
  **peerDependencies** (supplied by the apps).
- **`AUTH_COOKIE_PREFIX` must differ between the apps.** Cookies ignore the port, so on
  `localhost` a shared cookie name makes each app sign the other out.
- **Tests:** `pnpm --filter @repo/auth test` - Vitest unit tests. The credential and account tests
  moved to `apps/api` along with the logic they cover.

---

## Monorepo & tooling

### Why a monorepo

| Concern                           | Two separate repos    | This monorepo                            |
| --------------------------------- | --------------------- | ---------------------------------------- |
| Shared types across services      | Copy-paste or publish | One `@repo/contracts`, imported directly |
| Design system + config            | Duplicated, drifts    | One `@repo/config`, consumed everywhere  |
| Build order (app needs a package) | Manual                | Turborepo resolves it topologically      |
| Build/lint everything             | Multiple commands     | `pnpm build` / `pnpm lint`               |

**Dependency rule (one-way):** `apps/*` may import `packages/*`; `packages/*` must never import
`apps/*`.

### Workspaces (pnpm)

`pnpm-workspace.yaml` tells pnpm this repo is a monorepo and which folders are workspaces. A single
`pnpm install` at the root installs everything once and **links the local packages together**.

```yaml
packages:
  - "apps/*" # every app
  - "packages/*" # every shared package
```

An app then depends on a local package with the **`workspace:*`** protocol - "use the in-repo copy,
not a version from npm":

```json
{ "devDependencies": { "@repo/config": "workspace:*" } }
```

**Build-script approval (pnpm 10+).** By default pnpm **blocks** a dependency's install scripts
(`postinstall`, etc.) as a supply-chain safeguard; you opt specific packages back in:

```yaml
onlyBuiltDependencies: # allowlist - only these may run install scripts
  - prisma # postinstall downloads its query engine + generates the client
  - "@prisma/client"
  - "@prisma/engines"
ignoredBuiltDependencies: # intentionally skipped (silences the warning)
  - sharp # next/image optimizer - works without it, just slower
  - unrs-resolver
```

| Field                      | Meaning                                         |
| -------------------------- | ----------------------------------------------- |
| `onlyBuiltDependencies`    | Allowlist - only these run their install script |
| `ignoredBuiltDependencies` | Intentionally not built; no warning             |

### Turborepo pipeline

Turborepo runs the workspaces' scripts in the right **order**, in **parallel**, and with a **cache**.
Each key under `tasks` maps to a `package.json` script of the same name; `turbo run build` runs
`build` in every package that has one (others are skipped).

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**", "dist/**"] },
    "lint": { "dependsOn": ["^build"] }
  }
}
```

| Field                   | Meaning                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| `dependsOn: ["^build"]` | `^` = build my **upstream dependencies** first; `"build"` without `^` = a task in the same package |
| `outputs`               | Files Turbo caches after the task (`!` excludes a path); restored instantly on a cache hit         |
| `cache: false`          | Don't cache - used for `dev` (nothing to cache)                                                    |
| `persistent: true`      | Long-running task that never exits (dev servers)                                                   |

**How caching works:** Turbo hashes each task's inputs (source files + dependencies + task config +
declared env vars). Same hash → **cache hit** → outputs and logs are restored instantly ("FULL
TURBO"). Change one file → only that package's hash changes → only it (and its dependents) re-run.
Narrow a run with a filter:

```bash
turbo run build --filter=admin        # one app only
turbo run build --filter=...[HEAD^]   # only what a commit affected (CI)
```

### Shared config (`@repo/config`)

One package is the single source of truth for tooling. It has **no build step** - it just exports
config files, which each app and the repo root import:

```json
{
  "name": "@repo/config",
  "exports": {
    "./eslint": "./eslint/base.mjs",
    "./prettier": "./prettier/index.mjs",
    "./tsconfig": "./typescript/base.json",
    "./tailwind/theme.css": "./tailwind/theme.css"
  }
}
```

An app's `tsconfig.json` then extends the shared base:

```json
{ "extends": "@repo/config/tsconfig", "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }
```

### Code-style enforcement (two layers)

1. **Prettier owns formatting.** Shared options live in `@repo/config/prettier`; the root
   `prettier.config.mjs` re-exports them, so every file follows one style.
2. **ESLint owns correctness** (not formatting). The shared base carries only non-formatting rules;
   each app layers Next.js rules on top.

There is no pre-commit hook. Run `pnpm format` and `pnpm lint` before committing, or let the
editor do it on save — see below.

### Editor integration (VS Code)

`.vscode/` provides format-on-save + ESLint auto-fix (`settings.json`), the recommended extensions
(`extensions.json`: ESLint, Prettier, Tailwind), and a server-side debug config for each app
(`launch.json`).

### Reuse in another project

Minimal files to copy into a new monorepo:

**`pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
onlyBuiltDependencies: # add deps that legitimately need a postinstall
  - prisma
```

**`turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**", "!.next/cache/**"] },
    "lint": {},
    "typecheck": {}
  }
}
```

Four rules that always carry over:

1. A task that **writes files** → declare its `outputs` (so it can be cached).
2. A task that needs its dependencies built first → `dependsOn: ["^build"]`.
3. A long-running watch/dev task → `cache: false` + `persistent: true`.
4. A task that reads env vars → declare them in `env` so the cache never goes stale.

---

## Scripts reference

Run from the repo root:

| Command                         | Effect                                                          |
| ------------------------------- | --------------------------------------------------------------- |
| `pnpm dev`                      | Start all three services - API :3002, admin :3001, client :3000 |
| `pnpm build`                    | Production build of all workspaces (Turborepo, cached)          |
| `pnpm lint`                     | ESLint across all workspaces                                    |
| `pnpm typecheck`                | `next typegen` + `tsc --noEmit` across all workspaces           |
| `pnpm test`                     | Run tests across all workspaces (Vitest)                        |
| `pnpm format`                   | Prettier: format and write every file in the repo               |
| `pnpm format:check`             | Prettier: check formatting only, no writes (used in CI)         |
| `pnpm --filter <name> <script>` | Run a script in one workspace only                              |
| `pnpm --filter admin test`      | Run one app's tests only (same for `api`, `client`)             |

`pnpm build` and `pnpm dev` both need the database up, and `pnpm build` needs the API up as well -
the storefront prerenders pages that fetch.

Database scripts live in `apps/api`, the only workspace that talks to Postgres:

| Command                             | Effect                                           |
| ----------------------------------- | ------------------------------------------------ |
| `pnpm --filter api run db:pull`     | Introspect the DB + regenerate the Prisma client |
| `pnpm --filter api run db:generate` | Regenerate the client from the current schema    |
| `pnpm --filter api run db:studio`   | Open Prisma Studio (data browser)                |
