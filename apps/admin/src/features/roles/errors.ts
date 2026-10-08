import { ApiError } from "@repo/api-client";
import { type ActionResult, FIX_FIELDS_MESSAGE } from "@repo/ui/action-result";

const DENIED = "You don't have permission to manage roles.";

/**
 * Turns an API failure into something the form can show.
 *
 * A 409 is either a taken name — which belongs on that field — or a rule the caller broke, which
 * the API already phrased as a sentence.
 */
export function toRoleFailure<TInput>(error: unknown): ActionResult<TInput> {
  if (error instanceof ApiError) {
    if (error.status === 403) return { ok: false, error: DENIED };
    if (error.status === 404) return { ok: false, error: "That role no longer exists." };
    if (error.status === 400) {
      return { ok: false, error: FIX_FIELDS_MESSAGE, fieldErrors: error.fieldErrors as never };
    }
    if (error.status === 409) {
      return error.message.includes("already uses this name")
        ? {
            ok: false,
            error: FIX_FIELDS_MESSAGE,
            fieldErrors: { name: error.message } as never,
          }
        : { ok: false, error: error.message };
    }
  }
  console.error("[roles] write failed", error);
  return { ok: false, error: "Couldn't save the role. Please try again." };
}
