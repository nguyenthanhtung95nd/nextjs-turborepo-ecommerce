import { ApiError } from "@repo/api-client";
import type { TaxonomyFormInput } from "@repo/contracts";
import { type ActionResult, FIX_FIELDS_MESSAGE } from "@repo/ui/action-result";
import { TAXONOMY, type TaxonomyKind } from "./kinds";

export type TaxonomyResult = ActionResult<TaxonomyFormInput>;

/**
 * Turns an API failure into something the user can fix.
 *
 * Both `name` and `slug` are unique, so the conflict message decides which field is flagged.
 */
export function toTaxonomyFailure(error: unknown, kind: TaxonomyKind): TaxonomyResult {
  const { singular, deniedMessage } = TAXONOMY[kind];

  if (error instanceof ApiError) {
    if (error.status === 403) return { ok: false, error: deniedMessage };
    if (error.status === 404) return { ok: false, error: "That record no longer exists." };
    if (error.status === 400) {
      return { ok: false, error: FIX_FIELDS_MESSAGE, fieldErrors: error.fieldErrors };
    }
    if (error.status === 409) {
      if (error.message.includes("still used by products")) {
        return { ok: false, error: error.message };
      }
      const field = error.message.includes("name") ? "name" : "slug";
      return { ok: false, error: FIX_FIELDS_MESSAGE, fieldErrors: { [field]: error.message } };
    }
  }

  console.error(`[taxonomy] ${kind} write failed`, error);
  return { ok: false, error: `Couldn't save the ${singular}. Please try again.` };
}
