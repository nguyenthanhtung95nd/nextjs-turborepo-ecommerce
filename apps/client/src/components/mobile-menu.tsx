"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@repo/ui/sheet";
import type { CategoryEntry } from "@/lib/catalog/queries";

/**
 * The one client island in the header.
 *
 * The trigger sits inside `<Sheet>` rather than toggling state from outside it, so Radix knows
 * which element opened the drawer and returns focus there on close — a hand-rolled onClick
 * leaves keyboard users at the top of the document after Escape.
 */
export function MobileMenu({ categories }: { categories: readonly CategoryEntry[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open menu"
          className="grid size-10 place-items-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-72 p-0">
        <SheetTitle className="border-b border-border px-5 py-4 text-base font-semibold">
          Menu
        </SheetTitle>
        <nav className="flex flex-col p-2" aria-label="Mobile">
          <MenuLink href="/products" onNavigate={() => setOpen(false)}>
            Shop all
          </MenuLink>
          {categories.map((category) => (
            <MenuLink
              key={category.slug}
              href={`/categories/${category.slug}`}
              onNavigate={() => setOpen(false)}
            >
              {category.name}
              <span className="ml-auto text-xs text-muted-foreground">{category.productCount}</span>
            </MenuLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function MenuLink({
  href,
  onNavigate,
  children,
}: {
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[15px] font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </Link>
  );
}
