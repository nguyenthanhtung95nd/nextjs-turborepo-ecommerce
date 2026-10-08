"use client";

import { useRouter } from "next/navigation";
import { ApiError } from "@repo/api-client";
import type { ProductFormInput } from "@repo/contracts";
import { NotFoundPanel } from "@/components/not-found-panel";
import { useProductForEdit, useProductOptions } from "../api/use-product-form-data";
import { useUpdateProduct } from "../api/use-product-writes";
import { toProductFailure, type ProductResult } from "../errors";
import { PRODUCTS_ROUTE } from "../url";
import { DeleteProductButton } from "./delete-product-button";
import { ProductForm } from "./product-form";
import { ProductFormSkeleton } from "./product-form-skeleton";

export function ProductEditScreen({ id, canDelete }: { id: string; canDelete: boolean }) {
  const router = useRouter();
  const product = useProductForEdit(id);
  const options = useProductOptions();
  const update = useUpdateProduct(id);

  if (product.isPending || options.isPending) return <ProductFormSkeleton />;

  // A 404 here means the row went away, which is an answer rather than a fault — it gets its own
  // panel instead of the generic "something went wrong".
  if (product.isError) {
    const missing = product.error instanceof ApiError && product.error.status === 404;
    return (
      <NotFoundPanel
        title={missing ? "Product not found" : "Couldn't load this product"}
        description={
          missing
            ? "It may have been deleted while this page was open."
            : "Something went wrong on our side. The details have been logged."
        }
        backHref={PRODUCTS_ROUTE}
        backLabel="All products"
      />
    );
  }

  async function save(input: ProductFormInput): Promise<ProductResult> {
    try {
      await update.mutateAsync(input);
    } catch (error) {
      return toProductFailure(error, "product:update");
    }
    router.push(PRODUCTS_ROUTE);
    return { ok: true };
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Edit product</h1>
        <p className="mt-1 text-sm text-muted-foreground">{product.data.name}</p>
      </div>

      <ProductForm
        defaults={product.data.defaults}
        categories={options.data?.categories ?? []}
        brands={options.data?.brands ?? []}
        submitLabel="Save changes"
        action={save}
        dangerZone={
          canDelete ? (
            <section className="rounded-lg border border-border bg-card">
              <h2 className="border-b border-border px-4 py-3 font-semibold">Danger zone</h2>
              <div className="grid justify-items-start gap-3 p-4">
                <p className="text-sm text-muted-foreground">
                  Deleting is permanent. Archive the product instead to hide it from the storefront.
                </p>
                <DeleteProductButton
                  productId={product.data.id}
                  productName={product.data.name}
                  variant="destructive"
                  redirectTo={PRODUCTS_ROUTE}
                />
              </div>
            </section>
          ) : undefined
        }
      />
    </>
  );
}
