"use client";

import { useRouter } from "next/navigation";
import type { ProductFormInput } from "@repo/contracts";
import { useProductOptions } from "../api/use-product-form-data";
import { useCreateProduct } from "../api/use-product-writes";
import { toProductFailure, type ProductResult } from "../errors";
import { PRODUCTS_ROUTE } from "../url";
import { ProductForm } from "./product-form";
import { ProductFormSkeleton } from "./product-form-skeleton";

// A new product starts as a DRAFT so nothing reaches the storefront by accident.
const BLANK_PRODUCT: ProductFormInput = {
  name: "",
  slug: "",
  description: "",
  price: "",
  compareAtPrice: "",
  stock: "0",
  status: "DRAFT",
  categoryId: "",
  brandId: "",
  images: [],
};

export function ProductCreateScreen() {
  const router = useRouter();
  const options = useProductOptions();
  const create = useCreateProduct();

  if (options.isPending) return <ProductFormSkeleton />;

  async function save(input: ProductFormInput): Promise<ProductResult> {
    try {
      await create.mutateAsync(input);
    } catch (error) {
      return toProductFailure(error, "product:create");
    }
    router.push(PRODUCTS_ROUTE);
    return { ok: true };
  }

  return (
    <ProductForm
      defaults={BLANK_PRODUCT}
      categories={options.data?.categories ?? []}
      brands={options.data?.brands ?? []}
      submitLabel="Create product"
      action={save}
    />
  );
}
