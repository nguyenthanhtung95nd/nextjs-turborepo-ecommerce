"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  FolderTree,
  type LucideIcon,
  LayoutDashboard,
  Menu,
  UserCog,
  Package,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";
import { cn } from "@repo/ui/cn";
import type { NavIcon, NavItem } from "./nav-items";
import { Avatar, AvatarFallback } from "@repo/ui/avatar";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@repo/ui/sheet";
import { SignOutButton } from "@/features/auth/components/sign-out-button";

const ICONS: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  products: Package,
  categories: FolderTree,
  brands: Tags,
  users: Users,
  roles: ShieldCheck,
};

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

// Pages that are reachable but deliberately absent from the sidebar. Without them the
// breadcrumb falls back to "Dashboard" and quietly mislabels the page it is on.
const OFF_NAV_LABELS: Record<string, string> = {
  "/settings": "Your account",
};

interface Props {
  user: { email: string; name: string | null };
  nav: NavItem[];
  children: React.ReactNode;
}

export function AppShell({ user, nav, children }: Props) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const current =
    nav.find((i) => isActive(pathname, i.href))?.label ?? OFF_NAV_LABELS[pathname] ?? "Dashboard";
  const displayName = user.name ?? "Account";
  const initials = (user.name ?? user.email).slice(0, 2).toUpperCase();

  const sidebar = (
    <>
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <span className="grid size-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          A
        </span>
        <span className="font-semibold">Admin</span>
      </div>
      <nav className="flex flex-col gap-0.5 p-2" aria-label="Sections">
        <p className="px-2 pb-1.5 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Manage
        </p>
        {nav.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-foreground hover:bg-muted",
                active && "bg-muted",
              )}
            >
              <Icon className={cn("size-4 text-muted-foreground", active && "text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="grid min-h-screen md:grid-cols-[248px_1fr]">
      <aside
        className="hidden border-r border-border bg-muted/30 md:flex md:flex-col"
        aria-label="Primary"
      >
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur">
          {/* The trigger lives inside <Sheet> rather than toggling state from outside it, so
              Radix knows which element opened the drawer and returns focus there when it
              closes. A hand-rolled onClick leaves a keyboard user stranded at the top of the
              document after pressing Escape. */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {sidebar}
            </SheetContent>
          </Sheet>

          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground"
          >
            <span>Admin</span>
            <ChevronRight className="size-3.5 opacity-50" />
            <span className="truncate font-medium text-foreground">{current}</span>
          </nav>

          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label="Account menu"
                >
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">{displayName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{displayName}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* The sidebar lists the data being administered; a personal account page is a
                    different kind of thing, so it lives where people look for it. */}
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <UserCog />
                    Your account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <SignOutButton
                    variant="ghost"
                    withIcon
                    className="w-full justify-start text-destructive hover:bg-destructive/10"
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="p-5 md:p-6">{children}</main>
      </div>
    </div>
  );
}
