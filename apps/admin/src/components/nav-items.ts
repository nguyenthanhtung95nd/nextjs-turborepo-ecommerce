// Sidebar sections, kept out of app-shell.tsx on purpose: that file is a Client Component, and a
// Server Component importing a value from one receives a client reference rather than the array
// itself — the app layout filters this list by permission, so it needs the real thing.
export type NavIcon = "dashboard" | "products" | "categories" | "brands" | "users" | "roles";

export interface NavItem {
  href: string;
  label: string;
  permission: string | null;
  icon: NavIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Dashboard", permission: null, icon: "dashboard" },
  { href: "/products", label: "Products", permission: "product:read", icon: "products" },
  { href: "/categories", label: "Categories", permission: "category:manage", icon: "categories" },
  { href: "/brands", label: "Brands", permission: "brand:manage", icon: "brands" },
  { href: "/users", label: "Users", permission: "user:manage", icon: "users" },
  { href: "/roles", label: "Roles", permission: "role:manage", icon: "roles" },
];
