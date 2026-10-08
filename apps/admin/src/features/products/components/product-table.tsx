import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import {
  TABLE,
  TABLE_BODY,
  TABLE_CAPTION,
  TABLE_CELL,
  TABLE_CELL_LEAD,
  TABLE_HEAD,
  TABLE_HEAD_CELL,
  TABLE_HEAD_ROW,
  TABLE_ROW,
} from "@/components/responsive-table";
import { formatDate } from "@repo/ui/format";
import { formatMoney } from "@repo/ui/format";
import type { ProductRow } from "@/features/products/services";
import { ProductRowActions } from "./product-row-actions";
import { ProductStatusBadge } from "./product-status-badge";
import { pluralize } from "@repo/ui/format";

interface Props {
  rows: readonly ProductRow[];
  total: number;
  canUpdate: boolean;
  canDelete: boolean;
}

function Thumbnail({ url }: { url: string | null }) {
  if (!url) {
    return (
      <span className="grid size-9 flex-none place-items-center rounded-md border border-border bg-muted text-muted-foreground">
        <ImageOff className="size-4" aria-hidden="true" />
      </span>
    );
  }
  // `unoptimized`: image URLs are arbitrary external addresses typed by staff, so routing them
  // through the Next optimizer would mean allow-listing every host on the internet.
  return (
    <Image
      src={url}
      alt=""
      width={36}
      height={36}
      unoptimized
      className="size-9 flex-none rounded-md border border-border object-cover"
    />
  );
}

export function ProductTable({ rows, total, canUpdate, canDelete }: Props) {
  return (
    <table role="table" className={TABLE}>
      <caption role="caption" className={TABLE_CAPTION}>
        {rows.length} of {pluralize(total, "product", "products")}
      </caption>
      <thead role="rowgroup" className={TABLE_HEAD}>
        <tr role="row" className={TABLE_HEAD_ROW}>
          <th scope="col" role="columnheader" className={TABLE_HEAD_CELL}>
            Product
          </th>
          <th scope="col" role="columnheader" className={TABLE_HEAD_CELL}>
            Category
          </th>
          <th scope="col" role="columnheader" className={TABLE_HEAD_CELL}>
            Brand
          </th>
          <th scope="col" role="columnheader" className={`${TABLE_HEAD_CELL} md:text-right`}>
            Price
          </th>
          <th scope="col" role="columnheader" className={`${TABLE_HEAD_CELL} md:text-right`}>
            Stock
          </th>
          <th scope="col" role="columnheader" className={TABLE_HEAD_CELL}>
            Status
          </th>
          <th scope="col" role="columnheader" className={TABLE_HEAD_CELL}>
            Updated
          </th>
          <th scope="col" role="columnheader" className={`${TABLE_HEAD_CELL} md:text-right`}>
            Actions
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup" className={TABLE_BODY}>
        {rows.map((row) => (
          <tr key={row.id} role="row" className={TABLE_ROW}>
            <td role="cell" className={TABLE_CELL_LEAD}>
              <div className="flex min-w-56 items-center gap-2.5">
                <Thumbnail url={row.thumbnailUrl} />
                <span className="min-w-0">
                  <Link
                    href={`/products/${row.id}/edit`}
                    className="font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {row.name}
                  </Link>
                  <span className="block truncate text-xs text-muted-foreground">{row.slug}</span>
                </span>
              </div>
            </td>
            <td role="cell" className={TABLE_CELL} data-label="Category">
              {row.categoryName ?? "—"}
            </td>
            <td role="cell" className={TABLE_CELL} data-label="Brand">
              {row.brandName ?? "—"}
            </td>
            <td
              role="cell"
              className={`${TABLE_CELL} tabular-nums md:text-right`}
              data-label="Price"
            >
              {formatMoney(row.priceCents)}
            </td>
            <td
              role="cell"
              className={`${TABLE_CELL} tabular-nums md:text-right`}
              data-label="Stock"
            >
              {row.stock}
            </td>
            <td role="cell" className={TABLE_CELL} data-label="Status">
              <ProductStatusBadge status={row.status} />
            </td>
            <td role="cell" className={`${TABLE_CELL} whitespace-nowrap`} data-label="Updated">
              <time dateTime={row.updatedAt.toISOString()}>{formatDate(row.updatedAt)}</time>
            </td>
            <td role="cell" className={`${TABLE_CELL} max-md:mt-2 max-md:block`}>
              <ProductRowActions
                productId={row.id}
                productName={row.name}
                status={row.status}
                canUpdate={canUpdate}
                canDelete={canDelete}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
