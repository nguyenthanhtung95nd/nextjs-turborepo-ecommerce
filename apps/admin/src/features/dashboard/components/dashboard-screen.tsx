"use client";

import { LayoutDashboard } from "lucide-react";
import { pluralize } from "@repo/ui/format";
import { StatePanel } from "@/components/state-panel";
import { useProductStats } from "@/features/products/api/use-product-stats";
import { useRecentProducts } from "@/features/products/api/use-recent-products";
import { ProductStatusBadge } from "@/features/products/components/product-status-badge";
import { useRoleCount } from "@/features/roles/api/use-roles";
import { useRecentUsers } from "@/features/users/api/use-recent-users";
import { useUserCounts } from "@/features/users/api/use-users";
import { CountCard } from "./count-card";
import { ProductStatsCard } from "./product-stats-card";
import { RecentList } from "./recent-list";

const RECENT_LIMIT = 5;

interface Props {
  signedInAs: string;
  canReadProducts: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
}

export function DashboardScreen({
  signedInAs,
  canReadProducts,
  canManageUsers,
  canManageRoles,
}: Props) {
  // Each panel is skipped entirely when its permission is missing — a count of records someone
  // cannot open is noise, and the request to produce it is wasted. `enabled` is how a hook says
  // "do not run", since a hook cannot be called conditionally.
  const productStats = useProductStats(canReadProducts);
  const recentProducts = useRecentProducts(RECENT_LIMIT, canReadProducts);
  const userCounts = useUserCounts(canManageUsers);
  const recentUsers = useRecentUsers(RECENT_LIMIT, canManageUsers);
  const roleCount = useRoleCount(canManageRoles);

  const hasAnyPanel = canReadProducts || canManageUsers || canManageRoles;

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {signedInAs} · showing what your roles give you access to.
        </p>
      </div>

      {!hasAnyPanel ? (
        <div className="rounded-lg border border-border bg-card">
          <StatePanel
            icon={<LayoutDashboard className="size-5" />}
            title="Nothing to show yet"
            description="Your roles don't grant access to products, users or roles. Ask an administrator if you expected to see more."
          />
        </div>
      ) : (
        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
            {productStats.data && <ProductStatsCard counts={productStats.data} />}
            {userCounts.data && (
              <CountCard
                label="Users"
                value={userCounts.data.total}
                detail={`${pluralize(userCounts.data.staff, "staff account", "staff accounts")} · ${userCounts.data.deactivated} deactivated`}
                href="/users"
                linkLabel="All users"
              />
            )}
            {roleCount.data !== undefined && (
              <CountCard label="Roles" value={roleCount.data} href="/roles" linkLabel="All roles" />
            )}
          </div>

          {(recentProducts.data || recentUsers.data) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {recentProducts.data && (
                <RecentList
                  title="Recently added products"
                  entries={recentProducts.data.map((product) => ({
                    id: product.id,
                    label: product.name,
                    badge: <ProductStatusBadge status={product.status} />,
                    createdAt: product.createdAt,
                    href: `/products/${product.id}/edit`,
                  }))}
                  emptyMessage="No products yet."
                  allHref="/products"
                  allLabel="All products"
                />
              )}
              {recentUsers.data && (
                <RecentList
                  title="Recently added users"
                  entries={recentUsers.data.map((user) => ({
                    id: user.id,
                    label: user.label,
                    detail: user.email,
                    createdAt: user.createdAt,
                    href: `/users/${user.id}`,
                  }))}
                  emptyMessage="No users yet."
                  allHref="/users"
                  allLabel="All users"
                />
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
