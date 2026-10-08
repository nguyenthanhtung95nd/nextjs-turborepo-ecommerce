"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Textarea } from "@repo/ui/textarea";
import { FormField } from "@/components/form-field";
import { Panel } from "@/components/panel";
import type { ProductResult } from "@/features/products/errors";
import type { SelectOption } from "@/features/products/services";
import { type ProductFormInput, type ProductFormValues, productFormSchema } from "@repo/contracts";
import { PRODUCTS_ROUTE } from "@/features/products/url";
import { ProductFormSidebar } from "./product-form-sidebar";
import { ProductImageFields } from "./product-image-fields";

interface Props {
  defaults: ProductFormInput;
  categories: readonly SelectOption[];
  brands: readonly SelectOption[];
  submitLabel: string;
  /** Bound server action — `createProduct`, or `updateProduct` bound to the product's id. */
  action: (input: ProductFormInput) => Promise<ProductResult>;
  dangerZone?: React.ReactNode;
}

export function ProductForm({
  defaults,
  categories,
  brands,
  submitLabel,
  action,
  dangerZone,
}: Props) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    getValues,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaults,
  });

  // The raw string values go to the server, not the client-parsed ones: the action re-runs the
  // same schema, because client-side validation is a convenience and never a guarantee.
  async function onSubmit() {
    setFormError(null);
    const result = await action(getValues());
    if (result.ok) return; // the caller navigates away on success

    setFormError(result.error);
    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      setError(field as keyof ProductFormInput, { message });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
      {formError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </p>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 gap-5">
          <Panel title="Details">
            <FormField id="name" label="Product name" error={errors.name?.message}>
              <Input
                id="name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
                {...register("name")}
              />
            </FormField>

            <FormField
              id="slug"
              label="Slug"
              hint="Used in the storefront URL — lowercase letters, numbers and hyphens."
              error={errors.slug?.message}
            >
              <Input
                id="slug"
                aria-invalid={Boolean(errors.slug)}
                aria-describedby={errors.slug ? "slug-error" : undefined}
                {...register("slug")}
              />
            </FormField>

            <FormField
              id="description"
              label="Description"
              hint="Optional."
              error={errors.description?.message}
            >
              <Textarea
                id="description"
                aria-invalid={Boolean(errors.description)}
                {...register("description")}
              />
            </FormField>
          </Panel>

          <Panel title="Pricing &amp; inventory">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="price"
                label="Price (USD)"
                hint="Stored as integer cents."
                error={errors.price?.message}
              >
                <Input
                  id="price"
                  inputMode="decimal"
                  aria-invalid={Boolean(errors.price)}
                  aria-describedby={errors.price ? "price-error" : undefined}
                  {...register("price")}
                />
              </FormField>

              <FormField
                id="compareAtPrice"
                label="Compare-at price"
                hint="Optional — must be higher than the price."
                error={errors.compareAtPrice?.message}
              >
                <Input
                  id="compareAtPrice"
                  inputMode="decimal"
                  aria-invalid={Boolean(errors.compareAtPrice)}
                  aria-describedby={errors.compareAtPrice ? "compareAtPrice-error" : undefined}
                  {...register("compareAtPrice")}
                />
              </FormField>
            </div>

            <FormField id="stock" label="Stock" error={errors.stock?.message}>
              <Input
                id="stock"
                inputMode="numeric"
                className="max-w-48"
                aria-invalid={Boolean(errors.stock)}
                aria-describedby={errors.stock ? "stock-error" : undefined}
                {...register("stock")}
              />
            </FormField>
          </Panel>

          <ProductImageFields control={control} register={register} errors={errors} />
        </div>

        <ProductFormSidebar
          register={register}
          errors={errors}
          categories={categories}
          brands={brands}
          dangerZone={dangerZone}
        />
      </div>

      <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-background/90 py-3 backdrop-blur">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
        <Link href={PRODUCTS_ROUTE} className={buttonVariants({ variant: "outline" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
