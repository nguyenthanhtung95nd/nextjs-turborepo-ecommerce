import { Pagination } from "@/components/pagination";
import type { ProductListResult } from "@/features/products/services";
import { PRODUCTS_PAGE_SIZE, type ProductListParams } from "@repo/contracts";
import { productsHref } from "@/features/products/url";

interface Props {
  params: ProductListParams;
  result: ProductListResult;
}

export function ProductsPagination({ params, result }: Props) {
  return (
    <Pagination
      page={result.page}
      pageCount={result.pageCount}
      total={result.total}
      pageSize={PRODUCTS_PAGE_SIZE}
      label="Product list pages"
      hrefFor={(page) => productsHref(params, { page })}
    />
  );
}
