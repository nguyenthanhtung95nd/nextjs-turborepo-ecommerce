import Link from "next/link";
import type { CategoryEntry } from "@/lib/catalog/queries";

/*
 * The Help column — Delivery, Returns, Contact — is gone, along with the Orders link that used
 * to sit under Account.
 *
 * None of those pages exist, and none is specified anywhere in the product brief, so every one
 * of them 404ed. Stubbing them was the wrong fix twice over: an empty page is no better than a
 * missing one, and delivery and returns terms are legally meaningful statements that nobody
 * asked this project to write. They come back when there is real copy to put on them.
 */
const ACCOUNT_LINKS = [
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Create account" },
  { href: "/account", label: "Your account" },
];

export function SiteFooter({ categories }: { categories: readonly CategoryEntry[] }) {
  return (
    <footer className="mt-12 border-t border-border bg-muted">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        {/* Three columns now that Help is gone; a four-column template would leave a gap. */}
        <div className="grid gap-7 py-10 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr] md:gap-10">
          <div>
            <Link href="/" className="text-lg font-extrabold tracking-tight">
              volt<span className="text-primary">.</span>
            </Link>
            <p className="mt-2 max-w-[34ch] text-sm text-muted-foreground">
              A small range of desk gear, chosen rather than collected.
            </p>
          </div>

          <FooterColumn title="Shop">
            <FooterLink href="/products">All products</FooterLink>
            {categories.slice(0, 4).map((category) => (
              <FooterLink key={category.slug} href={`/categories/${category.slug}`}>
                {category.name}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Account">
            {ACCOUNT_LINKS.map((link) => (
              <FooterLink key={link.href} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </FooterColumn>
        </div>

        <p className="border-t border-border py-4 text-[13px] text-muted-foreground">
          © {new Date().getFullYear()} volt.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <nav aria-label={title}>
      <h2 className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <ul className="grid gap-2">{children}</ul>
    </nav>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-[15px] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
      </Link>
    </li>
  );
}
