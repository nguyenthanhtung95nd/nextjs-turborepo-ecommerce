"use client";

import { Select } from "@repo/ui/select";
import { FormField } from "@/components/form-field";
import { Panel } from "@/components/panel";
import type { SelectOption } from "@/features/products/services";
import { PRODUCT_STATUS_LABELS } from "@/features/products/labels";
import { PRODUCT_STATUSES } from "@repo/contracts";
import type { ProductFormErrors, ProductFormRegister } from "./product-form-types";

interface Props {
  register: ProductFormRegister;
  errors: ProductFormErrors;
  categories: readonly SelectOption[];
  brands: readonly SelectOption[];
  dangerZone?: React.ReactNode;
}

/**
 * Publishing state and taxonomy, kept beside the content rather than below it so the status a
 * product will be saved in is visible while its description is being written.
 */
export function ProductFormSidebar({ register, errors, categories, brands, dangerZone }: Props) {
  return (
    <aside className="grid min-w-0 gap-5">
      <Panel title="Status">
        <FormField
          id="status"
          label="Status"
          hint="Only published products appear in the storefront."
          error={errors.status?.message}
        >
          <Select id="status" aria-invalid={Boolean(errors.status)} {...register("status")}>
            {PRODUCT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PRODUCT_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </FormField>
      </Panel>

      <Panel title="Organization">
        <FormField id="categoryId" label="Category" error={errors.categoryId?.message}>
          <Select id="categoryId" {...register("categoryId")}>
            <option value="">— None —</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField id="brandId" label="Brand" error={errors.brandId?.message}>
          <Select id="brandId" {...register("brandId")}>
            <option value="">— None —</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </Select>
        </FormField>
      </Panel>

      {dangerZone}
    </aside>
  );
}
