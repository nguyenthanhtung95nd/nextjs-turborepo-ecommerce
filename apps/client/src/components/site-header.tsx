import Link from "next/link";
import { Search, ShoppingBag, User } from "lucide-react";
import type { CategoryEntry } from "@/lib/catalog/queries";
import { MobileMenu } from "./mobile-menu";

/**
 * The storefront header.
 *
 * A Server Component: the navigation is built from real categories, so it renders with the
 * page and needs no client-side fetch. Only the mobile menu — the one genuinely interactive
 * part — is a client island.
 *
 * Cart and account are placeholders in this phase; they link nowhere yet (see Phase 14).
 */
export function SiteHeader({ categories }: { categories: readonly CategoryEntry[] }) {
  return (
    <>
      <p className="bg-foreground px-4 py-1.5 text-center text-[12.5px] text-background">
        Free delivery on orders over $50 · 30-day returns
      </p>

      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
          <div className="flex h-16 items-center gap-3">
            <Link
              href="/"
              className="whitespace-nowrap text-xl font-extrabold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              volt<span className="text-primary">.</span>
            </Link>

            <nav className="ml-2 hidden gap-1 lg:flex" aria-label="Main">
              <HeaderLink href="/products">Shop all</HeaderLink>
              {categories.slice(0, 4).map((category) => (
                <HeaderLink key={category.slug} href={`/categories/${category.slug}`}>
                  {category.name}
                </HeaderLink>
              ))}
            </nav>

            <div className="ml-auto hidden max-w-[420px] flex-1 lg:block">
              <SearchField id="search-desktop" />
            </div>

            <div className="ml-auto flex items-center gap-1 lg:ml-3">
              <IconLink href="/account" label="Your account">
                <User className="size-5" aria-hidden="true" />
              </IconLink>
              <IconLink href="/cart" label="Cart">
                <ShoppingBag className="size-5" aria-hidden="true" />
              </IconLink>
              <MobileMenu categories={categories} />
            </div>
          </div>

          <div className="pb-3 lg:hidden">
            <SearchField id="search-mobile" />
          </div>
        </div>
      </header>
    </>
  );
}

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-[15px] font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </Link>
  );
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="grid size-10 place-items-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </Link>
  );
}

/**
 * A plain GET form, not a controlled input.
 *
 * The browser submits it natively to `/search?q=…`, so search works before hydration and with
 * JavaScript off — and the result is a real URL a shopper can share or bookmark.
 */
function SearchField({ id }: { id: string }) {
  return (
    <form action="/search" role="search" className="relative">
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        id={id}
        name="q"
        type="search"
        placeholder="Search products"
        className="h-[42px] w-full rounded-lg border border-border bg-card pl-9 pr-3 text-[15px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </form>
  );
}
