# Storefront

The customer-facing shop: browse, filter, search, product detail, accounts. Next.js App Router,
port **3000**.

It holds no database connection. Every read and every write goes to the API over HTTP, which makes
this app a BFF: it owns cookies, redirects and form state, and the API owns the rules.

## Run it

```bash
docker start ecommerce-postgres     # see ../../database/README.md
cp .env.example .env.local          # then fill in AUTH_SECRET
pnpm --filter api dev               # the API must be up first
pnpm --filter client dev
```

`pnpm dev` from the repo root starts both, plus the admin app.

Open <http://localhost:3000>. The catalogue comes from the dev seeds in
`../../database/seed/dev/` — without them the shop renders correctly and shows nothing.

### Environment

| Variable               | Purpose                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- |
| `AUTH_SECRET`          | Signs the session cookie. Generate with `npx auth secret`.                   |
| `AUTH_COOKIE_PREFIX`   | `shop-authjs`. Keeps this cookie apart from the admin's. See the note below. |
| `API_URL`              | `http://localhost:3002`.                                                     |
| `NEXT_PUBLIC_SITE_URL` | Public origin, used for canonical URLs, OpenGraph and the sitemap.           |

There is no `DATABASE_URL` here, and adding one would not do anything: this app has no Prisma
client. `.env.local` is gitignored and holds the only secrets this app has.

> **`AUTH_COOKIE_PREFIX` is not optional in development.** Cookies ignore the port, so both apps
> on `localhost` would otherwise share one `authjs.session-token` — signed with different secrets.
> The symptom is `JWTSessionError: no matching decryption secret` on every request, and signing
> into one app silently signing you out of the other.

## Commands

| Command                          | What it does                            |
| -------------------------------- | --------------------------------------- |
| `pnpm --filter client dev`       | Dev server on 3000                      |
| `pnpm --filter client build`     | Production build                        |
| `pnpm --filter client typecheck` | `next typegen` + `tsc --noEmit`         |
| `pnpm --filter client lint`      | ESLint                                  |
| `pnpm --filter client test`      | Vitest component and unit tests (jsdom) |

`pnpm --filter client build` needs the API running: the home page and every product page are
prerendered at build time, and prerendering fetches.

There is no browser suite. Anything that needs a real browser — the gallery's keyboard handling,
the filter drawer's focus, 404 status codes — is verified by hand.

## How it is put together

```
src/app/                routes and layouts only
  (home)/               home page + its skeleton, grouped so the skeleton applies to "/" alone
  products/(listing)/   the catalogue listing, grouped for the same reason
  products/[slug]/      product detail — prerendered, no loading.tsx (see below)
  categories/[slug]/    category landing page
  brands/[slug]/        brand landing page
  search/               search results
  login/ register/      authentication
  account/              the signed-in area
src/components/         rendering; `catalog/`, `product/` and `auth/` plus shared pieces
src/lib/                API calls, server actions, URL building
```

`lib/catalog/queries.ts` and the auth actions call `apiFetch` from `@repo/api-client`; the Zod
schemas they validate against live in `@repo/contracts`, shared with the API.

Dependencies run one way: `app/` and `components/` use `lib/`; `lib/` never imports from either.

### Rendering

Server-first throughout. The client islands are the mobile menu, the filter drawer, the sort
select, the product gallery and the two auth forms — each one because it genuinely needs state or
an event handler, and no higher in the tree than that.

| Route                | Rendering             | Why                                               |
| -------------------- | --------------------- | ------------------------------------------------- |
| `/`                  | Static, revalidate 60 | No dynamic input; most requests never hit the API |
| `/products/[slug]`   | SSG, revalidate 60    | All published slugs prerendered at build          |
| `/products`          | Dynamic               | Reads `searchParams`                              |
| `/categories/[slug]` | Dynamic               | Reads `searchParams`                              |
| `/search`            | Dynamic               | Reads `searchParams`                              |
| `/account`           | Dynamic               | Reads the session                                 |

The session is deliberately **not** read in the root layout: one `auth()` call there would make
every route below it dynamic, costing the home page and all the product pages their static
rendering.

### Why some routes have no `loading.tsx`

A `loading.tsx` is a Suspense boundary, and once a response starts streaming its status code has
already been sent. `notFound()` and `redirect()` can then only produce a 200. So the routes that
need a real 404 or a redirect — `products/[slug]`, `categories/[slug]`, `brands/[slug]`,
`account` — have no skeleton, and the ones that cannot 404 — the home page, the listing, search —
keep theirs.

This is also why the home page and the listing live in route groups: a `loading.tsx` at the root
of `app/` applies to **every** route, which both showed the wrong skeleton and made a 404 status
impossible anywhere in the app.

### URL as state

Every filter, sort and page lives in the URL, so results are shareable and the back button means
something. `src/lib/catalog/schema.ts` puts `.catch()` on every parameter, so a hand-edited or
hostile URL falls back to a default instead of throwing. `src/lib/catalog/url.ts` builds links
against whichever route the shopper is on — the listing, search, or a category or brand landing
page — so filtering never moves them somewhere else.

### Security

- Only `PUBLISHED` products are ever returned. The filter is applied **inside the API**, so this
  app cannot ask for a draft and a future consumer cannot forget to exclude one.
- Passwords are hashed and checked in the API; this app never sees a hash, and the minimum length
  comes from `@repo/contracts` so both ends agree.
- Sign-in failures are one message for every cause, so the form cannot be used to discover accounts.
- The browser never holds an API token. It lives inside the `httpOnly` session cookie and is only
  ever read on the server.
- `?next=` is narrowed by `src/lib/auth/safe-redirect.ts` to a path on this origin.
- Server actions re-check the session for themselves; they are public endpoints whatever the page does.
- Security headers are set in `next.config.ts`. There is **no CSP yet** — a useful one needs
  per-request nonces through middleware, and `unsafe-inline` would pass a scanner while blocking
  nothing.

### Known limitations

- `images.remotePatterns` allows any HTTPS host, because staff type product image URLs by hand.
  **Narrow it to real CDN hostnames before deploying publicly.**
- Search is `LIKE`-based. Fine at this catalogue size; a larger one wants Postgres full-text search.
- The storefront revalidates on a timer. On-demand `revalidatePath` from the admin's write actions
  would make the window irrelevant.
