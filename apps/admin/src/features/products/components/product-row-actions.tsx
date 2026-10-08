"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@repo/ui/button";
import { useSetProductStatus } from "../api/use-product-writes";
import { toProductFailure } from "../errors";
import type { ProductStatus } from "@repo/contracts";
import { DeleteProductButton } from "./delete-product-button";

// Publish and archive are reversible, so they act on one click — only delete asks first.
const NEXT_STATUS: Record<ProductStatus, { label: string; status: ProductStatus }> = {
  DRAFT: { label: "Publish", status: "PUBLISHED" },
  PUBLISHED: { label: "Archive", status: "ARCHIVED" },
  ARCHIVED: { label: "Publish", status: "PUBLISHED" },
};

interface Props {
  productId: string;
  productName: string;
  status: ProductStatus;
  canUpdate: boolean;
  canDelete: boolean;
}

export function ProductRowActions({ productId, productName, status, canUpdate, canDelete }: Props) {
  const [error, setError] = useState<string | null>(null);
  const changeStatusMutation = useSetProductStatus();
  const transition = NEXT_STATUS[status];
  const isPending = changeStatusMutation.isPending;

  function changeStatus() {
    setError(null);
    changeStatusMutation.mutate(
      { id: productId, status: transition.status },
      {
        onError: (cause) => {
          const failure = toProductFailure(cause, "product:update");
          if (!failure.ok) setError(failure.error);
        },
      },
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-1 md:items-end">
      <div className="flex flex-wrap justify-end gap-1">
        {canUpdate && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/products/${productId}/edit`}>
              <Pencil aria-hidden="true" />
              Edit
              {/* Every row has an "Edit" button; the name is what tells them apart in a
                  screen reader's element list. */}
              <span className="sr-only"> {productName}</span>
            </Link>
          </Button>
        )}

        {canUpdate && (
          <Button variant="ghost" size="sm" onClick={changeStatus} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {transition.label}
            <span className="sr-only"> {productName}</span>
          </Button>
        )}

        {canDelete && (
          <DeleteProductButton productId={productId} productName={productName} variant="ghost" />
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive md:text-right">
          {error}
        </p>
      )}
    </div>
  );
}
