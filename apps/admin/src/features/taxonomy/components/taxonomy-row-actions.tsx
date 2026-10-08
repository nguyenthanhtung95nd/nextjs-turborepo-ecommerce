"use client";

// Client-side on purpose. Radix's `asChild` clones the trigger element to merge its own props
// and ref onto it, which it cannot do to an element that was rendered on the server and handed
// across the RSC boundary as a prop — it fails with "failed to slot onto its children". The
// bound server actions still arrive from the server; only the markup is built here.
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import type { ActionResult } from "@repo/ui/action-result";
import type { TaxonomyRow } from "../services";
import type { TaxonomyFormInput } from "@repo/contracts";
import { TaxonomyFormDialog } from "./taxonomy-form-dialog";

interface Props {
  row: TaxonomyRow;
  /** Lower-case noun for mid-sentence copy: "category", "brand". */
  singular: string;
  updateAction: (input: TaxonomyFormInput) => Promise<ActionResult<TaxonomyFormInput>>;
  deleteAction: () => Promise<ActionResult<TaxonomyFormInput>>;
}

export function TaxonomyRowActions({ row, singular, updateAction, deleteAction }: Props) {
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <TaxonomyFormDialog
        title={`Edit ${singular}`}
        description={`Rename “${row.name}” or change the slug it uses in the storefront URL.`}
        submitLabel="Save changes"
        defaults={{ name: row.name, slug: row.slug }}
        action={updateAction}
        trigger={
          <Button variant="outline" size="sm">
            <Pencil aria-hidden="true" />
            Edit
            {/* Every row has an "Edit" button; the name is what tells them apart in a
                screen reader's element list. */}
            <span className="sr-only"> {row.name}</span>
          </Button>
        }
      />

      {row.productCount > 0 ? (
        // No dead control: a delete that cannot succeed is not offered. The Products column
        // next to it already says how many records are in the way.
        <span className="px-3 py-1.5 text-xs text-muted-foreground">In use</span>
      ) : (
        <ConfirmDeleteDialog
          title={`Delete “${row.name}”?`}
          description={`This removes the ${singular} permanently and cannot be undone. No products use it.`}
          confirmLabel={`Delete ${singular}`}
          action={deleteAction}
          trigger={
            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
              <Trash2 aria-hidden="true" />
              Delete
              <span className="sr-only"> {row.name}</span>
            </Button>
          }
        />
      )}
    </div>
  );
}
