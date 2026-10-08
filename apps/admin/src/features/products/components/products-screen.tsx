"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { productListParamsSchema } from "@repo/contracts";
import { Button, buttonVariants } from "@repo/ui/button";
import { pluralize } from "@repo/ui/format";
import { StatePanel } from "@/components/state-panel";
import { TABLE_SURFACE } from "@/components/responsive-table";
import { useProducts } from "../api/use-products";
import { useProductStats } from "../api/use-product-stats";
import { ActiveFilterChips } from "./active-filter-chips";
import { ProductTable } from "./product-table";
import { ProductsEmptyState } from "./products-empty-state";
import { ProductsPagination } from "./products-pagination";
import { ProductsSkeleton } from "./products-skeleton";
import { ProductsToolbar } from "./products-toolbar";

interface Props {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export function ProductsScreen({ canCreate, canUpdate, canDelete }: Props) {
  // The URL is the only place the filters live, so the screen derives them rather than holding
  // them: a shared link and the back button then work without any extra wiring.
  const searchParams = useSearchParams();
  const params = productListParamsSchema.parse(Object.fromEntries(searchParams));

  const products = useProducts(params);
  const stats = useProductStats();

  if (products.isPending) return <ProductsSkeleton />;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          {/* A failed count must not blank the list it only describes. */}
          {stats.data && (
            <p className="mt-1 text-sm text-muted-foreground">
              {pluralize(
                stats.data.DRAFT + stats.data.PUBLISHED + stats.data.ARCHIVED,
                "product",
                "products",
              )}{" "}
              · {stats.data.PUBLISHED} published
            </p>
          )}
        </div>
        {canCreate && (
          <Link href="/products/new" className={`ml-auto ${buttonVariants()}`}>
            <Plus aria-hidden="true" />
            New product
          </Link>
        )}
      </div>

      <ProductsToolbar params={params} />
      <ActiveFilterChips params={params} />

      <div className={TABLE_SURFACE}>
        {products.isError ? (
          <StatePanel
            tone="destructive"
            icon={<AlertTriangle className="size-5" />}
            title="Couldn't load products"
            description="Something went wrong on our side. The details have been logged — try again in a moment."
          >
            <Button variant="outline" onClick={() => void products.refetch()}>
              Try again
            </Button>
          </StatePanel>
        ) : products.data.rows.length === 0 ? (
          <ProductsEmptyState params={params} canCreate={canCreate} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <ProductTable
                rows={products.data.rows}
                total={products.data.total}
                canUpdate={canUpdate}
                canDelete={canDelete}
              />
            </div>
            <ProductsPagination params={params} result={products.data} />
          </>
        )}
      </div>
    </>
  );
}
