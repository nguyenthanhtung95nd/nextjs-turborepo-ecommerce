"use client";

import { formatDate } from "@repo/ui/format";
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
import type { TaxonomyFormInput } from "@repo/contracts";
import { useDeleteTaxonomy, useUpdateTaxonomy } from "../api/use-taxonomy";
import { toTaxonomyFailure } from "../errors";
import type { TaxonomyKind } from "../kinds";
import type { TaxonomyRow } from "../services";
import { TaxonomyRowActions } from "./taxonomy-row-actions";
import { pluralize } from "@repo/ui/format";

interface Props {
  kind: TaxonomyKind;
  singular: string;
  pluralLower: string;
  rows: readonly TaxonomyRow[];
}

export function TaxonomyTable({ kind, singular, pluralLower, rows }: Props) {
  const update = useUpdateTaxonomy(kind);
  const remove = useDeleteTaxonomy(kind);

  function updateAction(id: string) {
    return async (input: TaxonomyFormInput) => {
      try {
        await update.mutateAsync({ id, input });
        return { ok: true } as const;
      } catch (error) {
        return toTaxonomyFailure(error, kind);
      }
    };
  }

  function deleteAction(id: string) {
    return async () => {
      try {
        await remove.mutateAsync(id);
        return { ok: true } as const;
      } catch (error) {
        return toTaxonomyFailure(error, kind);
      }
    };
  }

  return (
    <table role="table" className={TABLE}>
      <caption role="caption" className={TABLE_CAPTION}>
        {pluralize(rows.length, singular, pluralLower)}
      </caption>
      <thead role="rowgroup" className={TABLE_HEAD}>
        <tr role="row" className={TABLE_HEAD_ROW}>
          <th scope="col" role="columnheader" className={TABLE_HEAD_CELL}>
            Name
          </th>
          <th scope="col" role="columnheader" className={TABLE_HEAD_CELL}>
            Slug
          </th>
          <th scope="col" role="columnheader" className={`${TABLE_HEAD_CELL} md:text-right`}>
            Products
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
            <td role="cell" className={`${TABLE_CELL_LEAD} font-semibold`}>
              {row.name}
            </td>
            <td role="cell" className={`${TABLE_CELL} text-muted-foreground`} data-label="Slug">
              {row.slug}
            </td>
            <td
              role="cell"
              className={`${TABLE_CELL} tabular-nums md:text-right`}
              data-label="Products"
            >
              {row.productCount}
            </td>
            <td role="cell" className={`${TABLE_CELL} whitespace-nowrap`} data-label="Updated">
              <time dateTime={row.updatedAt.toISOString()}>{formatDate(row.updatedAt)}</time>
            </td>
            <td role="cell" className={`${TABLE_CELL} max-md:mt-2 max-md:block`}>
              {/* Bound here, in a Server Component: the client never learns which table it is
                  editing, and the id cannot be swapped in the submitted payload. */}
              <TaxonomyRowActions
                row={row}
                singular={singular}
                updateAction={updateAction(row.id)}
                deleteAction={deleteAction(row.id)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
