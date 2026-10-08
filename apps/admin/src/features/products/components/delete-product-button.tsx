"use client";

import { Trash2 } from "lucide-react";
import { Button, type ButtonProps } from "@repo/ui/button";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { useDeleteProduct } from "../api/use-product-writes";
import { toProductFailure } from "../errors";

interface Props {
  productId: string;
  productName: string;
  variant: ButtonProps["variant"];
  /** Where to go afterwards. The list revalidates in place, so it omits this. */
  redirectTo?: string;
}

/**
 * The delete affordance for one product, warning copy included.
 *
 * Both the list row and the edit page's danger zone use it, so the wording of an irreversible
 * action is written once — two copies would be two chances to describe it differently.
 */
export function DeleteProductButton({ productId, productName, variant, redirectTo }: Props) {
  const remove = useDeleteProduct();

  async function confirmDelete() {
    try {
      await remove.mutateAsync(productId);
      return { ok: true } as const;
    } catch (error) {
      const failure = toProductFailure(error, "product:delete");
      return failure.ok ? ({ ok: true } as const) : ({ ok: false, error: failure.error } as const);
    }
  }

  return (
    <ConfirmDeleteDialog
      title={`Delete “${productName}”?`}
      description="This permanently removes the product and its images, and cannot be undone. To hide it from the storefront instead, archive it."
      confirmLabel="Delete product"
      action={confirmDelete}
      redirectTo={redirectTo}
      trigger={
        <Button
          variant={variant}
          size="sm"
          className={variant === "ghost" ? "text-destructive hover:bg-destructive/10" : undefined}
        >
          <Trash2 aria-hidden="true" />
          Delete
          <span className="sr-only"> {productName}</span>
        </Button>
      }
    />
  );
}
