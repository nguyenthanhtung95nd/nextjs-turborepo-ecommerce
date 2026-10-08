import { ApiError } from "@repo/api-client";
import type { ProductFormInput } from "@repo/contracts";
import { type ActionResult, FIX_FIELDS_MESSAGE } from "@repo/ui/action-result";

export type ProductResult = ActionResult<ProductFormInput>;

// Keyed by permission so the message names the operation, not the permission string.
const DENIED_MESSAGES = {
  "product:create": "You don't have permission to create products.",
  "product:delete": "You don't have permission to delete products.",
  "product:update": "You don't have permission to edit products.",
} as const;

export type ProductOperation = keyof typeof DENIED_MESSAGES;

/**
 * Turns an API failure into a message the form can show.
 *
 * A conflict is an expected outcome of valid-looking input, so it lands on the field that caused
 * it. Anything unrecognised is logged here and reported generically.
 *
 * Pure on purpose: the same mapping serves every caller, and it is the reason a 409 reads the
 * same wherever it surfaces.
 */
export function toProductFailure(error: unknown, operation: ProductOperation): ProductResult {
  if (error instanceof ApiError) {
    if (error.status === 403) return { ok: false, error: DENIED_MESSAGES[operation] };
    if (error.status === 404) return { ok: false, error: "That product no longer exists." };
    if (error.status === 409) {
      return error.message.includes("slug")
        ? { ok: false, error: FIX_FIELDS_MESSAGE, fieldErrors: { slug: error.message } }
        : { ok: false, error: error.message };
    }
    if (error.status === 400) {
      return { ok: false, error: FIX_FIELDS_MESSAGE, fieldErrors: error.fieldErrors };
    }
  }
  console.error("[products] write failed", error);
  return { ok: false, error: "Couldn't save the product. Please try again." };
}
