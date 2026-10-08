"use client";

import { FolderTree, Plus } from "lucide-react";
import { Button } from "@repo/ui/button";
import { TABLE_SURFACE } from "@/components/responsive-table";
import { StatePanel } from "@/components/state-panel";
import { pluralize } from "@repo/ui/format";
import { AlertTriangle } from "lucide-react";
import type { TaxonomyFormInput } from "@repo/contracts";
import { useCreateTaxonomy, useTaxonomy } from "../api/use-taxonomy";
import { toTaxonomyFailure } from "../errors";
import { TAXONOMY, type TaxonomyKind } from "../kinds";
import { TaxonomyLoading } from "./taxonomy-loading";
import { TaxonomyFormDialog } from "./taxonomy-form-dialog";
import { TaxonomyTable } from "./taxonomy-table";

const BLANK = { name: "", slug: "" };

/**
 * The category/brand screen. The two kinds differ only in wording, so one component serves both.
 */
export function TaxonomyScreen({ kind }: { kind: TaxonomyKind }) {
  const meta = TAXONOMY[kind];
  const list = useTaxonomy(kind);
  const create = useCreateTaxonomy(kind);

  async function createAction(input: TaxonomyFormInput) {
    try {
      await create.mutateAsync(input);
      return { ok: true } as const;
    } catch (error) {
      return toTaxonomyFailure(error, kind);
    }
  }

  if (list.isPending) return <TaxonomyLoading />;

  if (list.isError) {
    return (
      <div className={TABLE_SURFACE}>
        <StatePanel
          tone="destructive"
          icon={<AlertTriangle className="size-5" />}
          title={`Couldn't load ${meta.pluralLower}`}
          description="Something went wrong on our side. The details have been logged — try again in a moment."
        >
          <Button variant="outline" onClick={() => void list.refetch()}>
            Try again
          </Button>
        </StatePanel>
      </div>
    );
  }

  const rows = list.data ?? [];
  const inUse = rows.filter((row) => row.productCount > 0).length;

  const createDialog = (
    <TaxonomyFormDialog
      title={meta.createLabel}
      description={`Add a ${meta.singular}. The slug is filled in from the name and stays editable.`}
      submitLabel={`Create ${meta.singular}`}
      defaults={BLANK}
      action={createAction}
      trigger={
        <Button>
          <Plus aria-hidden="true" />
          {meta.createLabel}
        </Button>
      }
    />
  );

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{meta.plural}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pluralize(rows.length, meta.singular, meta.pluralLower)} · {inUse} used by products
          </p>
        </div>
        <div className="ml-auto">{createDialog}</div>
      </div>

      <div className={TABLE_SURFACE}>
        {rows.length === 0 ? (
          <StatePanel
            icon={<FolderTree className="size-5" />}
            title={`No ${meta.pluralLower} yet`}
            description={`Create your first ${meta.singular} so products can be organised by it.`}
          >
            {createDialog}
          </StatePanel>
        ) : (
          <div className="overflow-x-auto">
            <TaxonomyTable
              kind={kind}
              singular={meta.singular}
              pluralLower={meta.pluralLower}
              rows={rows}
            />
          </div>
        )}
      </div>
    </>
  );
}
