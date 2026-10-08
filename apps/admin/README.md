# Admin

The back office: products, categories, brands, users and RBAC. Next.js App Router, port **3001**.

It holds no database connection. Every read and every write goes to the API over HTTP, which makes
this app a BFF: it owns cookies, redirects and form state, and the API owns the rules.

## Run it

```bash
docker start ecommerce-postgres     # see ../../database/README.md
cp .env.example .env.local          # then fill in AUTH_SECRET
pnpm --filter api dev               # the API must be up first
pnpm --filter admin dev
```

`pnpm dev` from the repo root starts both, plus the storefront.

Sign in at <http://localhost:3001/login> with the seeded account: `admin@local.dev` /
`Admin123!`.

### Environment

| Variable             | Purpose                                                        |
| -------------------- | -------------------------------------------------------------- |
| `AUTH_SECRET`        | Signs the session cookie. Generate with `npx auth secret`.     |
| `AUTH_COOKIE_PREFIX` | `admin-authjs`. Keeps this cookie apart from the storefront's. |
| `API_URL`            | `http://localhost:3002`.                                       |

There is no `DATABASE_URL` here, and adding one would not do anything: this app has no Prisma
client. `.env.local` is gitignored and holds the only secrets this app has.

## Commands

| Command                         | What it does                                   |
| ------------------------------- | ---------------------------------------------- |
| `pnpm --filter admin dev`       | Dev server on 3001                             |
| `pnpm --filter admin build`     | Production build                               |
| `pnpm --filter admin typecheck` | `next typegen` + `tsc --noEmit`                |
| `pnpm --filter admin lint`      | ESLint                                         |
| `pnpm --filter admin test`      | Vitest — `unit` (node) and `component` (jsdom) |

## How it is put together

```
src/app/(app)/      routes + layouts only; the layout is the admin gate
src/components/     rendering; one folder per domain, plus shared pieces at the top
src/lib/            everything else — API calls, server actions, formatting
```

Dependencies run one way: `app` → `components` → `lib`. `lib` imports neither of the others.

**`lib/<domain>/queries.ts` reads, `actions.ts` writes.** Both call `apiFetch` from
`@repo/api-client` with the session's token; neither contains a rule. The Zod schemas live in
`@repo/contracts` and are shared with the API, so `lib/<domain>/schema.ts` is a re-export.

**Client-first, but on the leaves.** Pages are Server Components; `"use client"` sits on the
interactive parts (forms, dialogs, the search box). Server shells wrap small client islands
rather than the other way round.

**Lists keep their state in the URL.** Search, filters, sort and page are query parameters, so
a filtered list is a shareable link and the back button works. Every parameter is parsed with
Zod `.catch()`, so a hand-edited URL degrades to the default view instead of a 500.

**Server actions return data, not exceptions.** Everything goes through `ActionResult` in
`lib/action-result.ts`: `{ ok: true }` or `{ ok: false, error, fieldErrors? }`. A thrown error
would reach the browser as an opaque digest; a taken slug or a missing permission is something
the user can act on, so it comes back as a message on the right field.

Translating the API's reply into that shape is the BFF's job: 403 becomes the denial sentence for
that screen, 404 becomes "no longer exists", 409 lands on the field that caused it (a taken email,
a taken slug), and 400 carries the API's field errors straight through.

## Security

- **Authorization is decided by the API.** The guard in this app decides what to render; the
  API decides what is allowed, and it re-reads the account and its permissions from the database
  on every request. Calling a server action directly, or the API directly, gets the same answer.
- **Deactivating an account ends its access on the next request**, even though the session cookie
  is still valid, because the API checks `is_active` every time.
- **The browser never holds an API token.** It is kept inside the `httpOnly` session cookie and
  only ever read on the server.
- **Lockout is refused, not warned about.** You cannot deactivate your own account, drop your
  own `user:manage`, or remove the last grant of `role:manage` — recovering from any of those
  needs a database client.
- **Errors never leak internals.** Route boundaries log the cause server-side and show a plain
  sentence. Unique and foreign-key violations are translated into field messages.
- Security headers are set in `next.config.ts`.

### Known gaps

- **No Content-Security-Policy.** Next injects inline scripts for hydration, so a real policy
  needs per-request nonces through middleware. `unsafe-inline` would pass a scanner and block
  nothing, so it is deliberately absent rather than faked.
- **Changing a password does not end sessions on other devices.** The JWT stays valid until it
  expires. Same root cause as above: revocation needs server-side session state.
- **No audit trail.** Nothing records who changed what. The dashboard says _Recently added_ and
  orders by `created_at`, which is the only claim the schema supports.

## Testing

| Layer       | Where              | Covers                                                       |
| ----------- | ------------------ | ------------------------------------------------------------ |
| `unit`      | `tests/*.test.ts`  | Zod schemas, money, slugs, URL building, permission grouping |
| `component` | `tests/*.test.tsx` | Checklists, the debounced search field, the delete dialog    |

There is no browser suite. Anything that needs a real browser — the admin gate, RBAC denial,
focus handling — is verified by hand.

Some rules cannot be reached end-to-end — refusing the last grant of `role:manage` requires
reducing the whole database to one grant, which would break every test running beside it. That
decision is a pure function with unit tests, and it now lives beside the rule it protects in
`apps/api/src/roles/lockout.ts`.
