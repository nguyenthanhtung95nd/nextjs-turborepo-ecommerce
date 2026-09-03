# E-Commerce Platform - Admin + Storefront Monorepo

Learning and self building: **two Next.js (App Router) applications** - a back-office
**admin** app and a customer **storefront** - sharing one design system, one set of tooling, and one
PostgreSQL database. Managed as a **pnpm + Turborepo monorepo**, built **database-first**.

---

## Contents

- [E-Commerce Platform - Admin + Storefront Monorepo](#e-commerce-platform---admin--storefront-monorepo)
  - [Contents](#contents)
  - [Overview](#overview)
  - [Tech stack](#tech-stack)
  - [Repository layout](#repository-layout)
  - [Prerequisites](#prerequisites)
  - [Quick start (run the apps)](#quick-start-run-the-apps)
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
    - [`@repo/db` - database client (DB-first)](#repodb---database-client-db-first)
    - [`@repo/auth` - authentication + RBAC](#repoauth---authentication--rbac)
  - [Monorepo \& tooling](#monorepo--tooling)
    - [Why a monorepo](#why-a-monorepo)
    - [Workspaces (pnpm)](#workspaces-pnpm)
    - [Turborepo pipeline](#turborepo-pipeline)
    - [Shared config (`@repo/config`)](#shared-config-repoconfig)
    - [Code-style enforcement (three layers)](#code-style-enforcement-three-layers)
    - [Editor integration (VS Code)](#editor-integration-vs-code)
    - [Reuse in another project](#reuse-in-another-project)
  - [Scripts reference](#scripts-reference)

---

## Overview

Two independent apps share code through local packages instead of living in separate repositories
that drift apart:

| Part           | Path              | Runs on               | Role                                                              |
| -------------- | ----------------- | --------------------- | ----------------------------------------------------------------- |
| Admin app      | `apps/admin`      | http://localhost:3001 | Back office - catalog, users, roles/permissions (RBAC)            |
| Storefront app | `apps/client`     | http://localhost:3000 | Customer-facing - browse, filter, search, auth                    |
| Shared config  | `packages/config` | -                     | ESLint / Prettier / tsconfig / Tailwind presets (`@repo/config`)  |
| Database layer | `packages/db`     | -                     | Generated Prisma client over the SQL schema (`@repo/db`)          |
| Auth + RBAC    | `packages/auth`   | -                     | Auth.js v5 (Credentials + JWT) + permission guards (`@repo/auth`) |

**Design principles that shape everything here:**

- **Database-first.** Hand-written SQL in `database/` is the source of truth. Prisma is only a
  **generated client** (`prisma db pull`), never the schema owner - there is no `prisma migrate`.
- **One-way dependencies.** `apps/*` may import `packages/*`; packages never import apps.
- **Tooling is centralized.** Lint, format, and TypeScript rules live once in `@repo/config` and are
  consumed everywhere, so nothing drifts.

---

## Tech stack

| Layer             | Choice                                                  |
| ----------------- | ------------------------------------------------------- |
| Framework         | Next.js 16 (App Router, Turbopack) · React 19           |
| Language          | TypeScript 5 (strict)                                   |
| Styling           | Tailwind CSS v4                                         |
| Database          | PostgreSQL 16                                           |
| ORM (client only) | Prisma 6 (introspected via `db pull`)                   |
| Monorepo          | pnpm workspaces + Turborepo                             |
| Quality           | ESLint 9 (flat config) · Prettier · Husky + lint-staged |
| Runtime           | Node.js 22 · pnpm 10.33.0                               |

---

## Repository layout

```
nextjs-playground/
├── apps/
│   ├── admin/              # Next.js back office   → :3001
│   └── client/             # Next.js storefront    → :3000
├── packages/
│   ├── config/             # shared ESLint / Prettier / tsconfig / Tailwind  (@repo/config)
│   ├── db/                 # Prisma client (generated) + server-only singleton (@repo/db)
│   └── auth/               # Auth.js v5 (Credentials + JWT) + RBAC guards (@repo/auth)
├── database/               # DATABASE-FIRST: the SQL source of truth
│   ├── migrations/         # 001…009 - CREATE TABLE scripts, applied in order
│   └── seed/
│       ├── reference/      # permission catalog - seeded in EVERY environment
│       └── dev/            # baseline roles + a dev admin - LOCAL ONLY
├── docs/                   # PRD + implementation plan
├── .husky/                 # git hooks (pre-commit → lint-staged)
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

## Quick start (run the apps)

The apps run on their own - you do **not** need the database to see them render.

```bash
corepack enable          # activates the pinned pnpm version
pnpm install             # installs all workspaces + sets up git hooks
pnpm dev                 # starts BOTH apps
```

- Storefront → **http://localhost:3000**
- Admin → **http://localhost:3001**

Run a single app with a filter:

```bash
pnpm --filter admin dev      # admin only
pnpm --filter client dev     # storefront only
```

To work on data-backed features, continue to [Database setup](#database-setup).

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
| `seed/dev/`       | **local development only**                 | Baseline roles + a dev admin account                                     |

**Local development** - apply reference first, then dev (assumes the `docker cp` from step 3):

```bash
docker exec ecommerce-postgres sh -c \
  'for f in /tmp/database/seed/reference/*.sql /tmp/database/seed/dev/*.sql; do echo "seeding $f"; psql -U app -d ecommerce -v ON_ERROR_STOP=1 -f "$f"; done'
```

**Production** - apply **only** `seed/reference/`. Never run `seed/dev/` there; in production the
first admin is created through a secure, env-driven bootstrap, not committed SQL.

This inserts 8 permissions, 3 roles (`SUPER_ADMIN`, `CATALOG_EDITOR`, `USER_MANAGER`), their
permission links, and one admin user.

**Dev admin credentials** (local only - stored as a bcrypt hash in `seed/dev/02_admin.sql`):

| Email             | Password    | Role          |
| ----------------- | ----------- | ------------- |
| `admin@local.dev` | `Admin123!` | `SUPER_ADMIN` |

### 5. Generate the Prisma client

Prisma introspects the live database and generates a type-safe client into
`packages/db/src/generated/prisma` (gitignored):

```bash
# copy the env template and point Prisma at your database
cp packages/db/.env.example packages/db/.env
# packages/db/.env → DATABASE_URL="postgres://app:app@localhost:5432/ecommerce?sslmode=disable"

pnpm --filter @repo/db run db:pull      # = prisma db pull + prisma generate
```

Re-run `db:pull` any time the SQL schema changes. Consume the client (server-side only) via:

```ts
import { prisma } from "@repo/db";
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

Or browse the data with `pnpm --filter @repo/db run db:studio`.

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

Shared building blocks under `packages/*`. Apps import them by name (`@repo/*`); packages never
import apps. Each is a `workspace:*` dependency, ships **no build step**, and exposes its TypeScript
source directly (apps compile it via `transpilePackages`).

| Package        | Import         | Purpose                                         | Runtime      |
| -------------- | -------------- | ----------------------------------------------- | ------------ |
| `@repo/config` | `@repo/config` | ESLint / Prettier / tsconfig / Tailwind presets | No (config)  |
| `@repo/db`     | `@repo/db`     | Generated Prisma client over the SQL schema     | Yes (server) |
| `@repo/auth`   | `@repo/auth`   | Auth.js v5 (Credentials + JWT) + RBAC guards    | Yes (server) |

### `@repo/config` - shared tooling presets

Single source of truth for lint/format/TS/Tailwind, consumed via subpath exports:

| Export                            | Consumed by                                                     |
| --------------------------------- | --------------------------------------------------------------- |
| `@repo/config/eslint`             | each app's `eslint.config.mjs` + the root `eslint.config.mjs`   |
| `@repo/config/prettier`           | root `prettier.config.mjs` (re-export) - governs the whole repo |
| `@repo/config/tsconfig`           | every `tsconfig.json` via `"extends"`                           |
| `@repo/config/tailwind/theme.css` | each app's `globals.css` via `@import`                          |

### `@repo/db` - database client (DB-first)

Prisma is a **generated client only** - the SQL in `database/` owns the schema. Exposes one
server-only `prisma` singleton plus the generated model types.

```ts
import { prisma } from "@repo/db"; // server-side only (Server Components, route handlers, actions)
```

- **Config:** `prisma/schema.prisma` sets the generator (`prisma-client-js`, output
  `src/generated/prisma`) + datasource (`env("DATABASE_URL")`). The generated client is **gitignored**
  - (re)generate it with `pnpm --filter @repo/db run db:pull` (see [Database setup](#database-setup)).
- **Needs** `packages/db/.env` with `DATABASE_URL`.
- **Consumers** set `transpilePackages: ["@repo/db"]` + `serverExternalPackages: ["@prisma/client"]`.

### `@repo/auth` - authentication + RBAC

Auth.js v5 with the Credentials provider (bcrypt) and a **JWT** session carrying the user's
**permission union**. Shared by both apps; the login UI is per-app (later phases).

| Export                        | Use                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `handlers`                    | `export const { GET, POST } = handlers` in `app/api/auth/[...nextauth]/route.ts` |
| `auth()`                      | read the current session in Server Components / actions                          |
| `requirePermission(key)`      | server guard - throws `ForbiddenError` (403) when the session lacks `key`        |
| `hasPermission(session, key)` | boolean check (UX-level)                                                         |
| `PERMISSIONS` / `Permission`  | hardcoded permission catalog - must match `database/seed/reference/`             |

```ts
// server action, gated server-side (hiding the button is only cosmetic)
import { requirePermission } from "@repo/auth";

export async function deleteProduct(id: string) {
  await requirePermission("product:delete"); // throws 403 if the session lacks it
  // ...delete
}
```

- **Config:** each app needs `AUTH_SECRET` + `DATABASE_URL` (copy `apps/<app>/.env.example` →
  `.env.local`; generate the secret with `npx auth secret`), sets
  `transpilePackages: ["@repo/auth", "@repo/db"]`, and wires the route above. `next`/`react` are
  **peerDependencies** (supplied by the apps).
- **Tests:** `pnpm --filter @repo/auth test` - Vitest unit tests + a DB-backed integration test
  (self-skips when no DB is available).

---

## Monorepo & tooling

### Why a monorepo

| Concern                           | Two separate repos    | This monorepo                           |
| --------------------------------- | --------------------- | --------------------------------------- |
| Shared DB layer / types           | Copy-paste or publish | One `packages/db`, imported directly    |
| Design system + config            | Duplicated, drifts    | One `@repo/config`, consumed everywhere |
| Build order (app needs a package) | Manual                | Turborepo resolves it topologically     |
| Build/lint everything             | Multiple commands     | `pnpm build` / `pnpm lint`              |

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

### Code-style enforcement (three layers)

1. **Prettier owns formatting.** Shared options live in `@repo/config/prettier`; the root
   `prettier.config.mjs` re-exports them, so every file follows one style.
2. **ESLint owns correctness** (not formatting). The shared base carries only non-formatting rules;
   each app layers Next.js rules on top.
3. **Pre-commit hook blocks unformatted commits.** Husky runs `lint-staged` on staged files:

   ```sh
   # .husky/pre-commit
   pnpm exec lint-staged
   ```

   ```json
   // root package.json
   "lint-staged": {
     "*.{ts,tsx,js,jsx,mjs}": ["prettier --write", "eslint --fix"],
     "*.{json,md,css}": ["prettier --write"]
   }
   ```

Hooks install automatically via the `"prepare": "husky"` script during `pnpm install`.

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

| Command                         | Effect                                                                |
| ------------------------------- | --------------------------------------------------------------------- |
| `pnpm dev`                      | Start both apps (Turbopack) - admin :3001, client :3000               |
| `pnpm build`                    | Production build of all workspaces (Turborepo, cached)                |
| `pnpm lint`                     | ESLint across all workspaces                                          |
| `pnpm typecheck`                | `next typegen` + `tsc --noEmit` across all workspaces                 |
| `pnpm test`                     | Run tests across all workspaces (Vitest - currently `@repo/auth`)     |
| `pnpm format`                   | Prettier: format and write every file in the repo                     |
| `pnpm format:check`             | Prettier: check formatting only, no writes (used in CI)               |
| `pnpm prepare`                  | Runs automatically after `pnpm install`; installs the Husky git hooks |
| `pnpm --filter <name> <script>` | Run a script in one workspace only                                    |

Database scripts live in the `@repo/db` package (not the root):

| Command                                  | Effect                                           |
| ---------------------------------------- | ------------------------------------------------ |
| `pnpm --filter @repo/db run db:pull`     | Introspect the DB + regenerate the Prisma client |
| `pnpm --filter @repo/db run db:generate` | Regenerate the client from the current schema    |
| `pnpm --filter @repo/db run db:studio`   | Open Prisma Studio (data browser)                |
