import { ApiError } from "@repo/api-client";
import { type ActionResult, FIX_FIELDS_MESSAGE } from "@repo/ui/action-result";

const DENIED = "You don't have permission to manage users.";

/**
 * Turns an API failure into something the form can show.
 *
 * A 409 is either a taken email — which belongs on that field — or a rule the caller broke, such
 * as removing their own last permission. The API phrases those as sentences, so they are shown
 * as written rather than re-worded here.
 */
export function toUserFailure<TInput>(error: unknown): ActionResult<TInput> {
  if (error instanceof ApiError) {
    if (error.status === 403) return { ok: false, error: DENIED };
    if (error.status === 404) return { ok: false, error: "That user no longer exists." };
    if (error.status === 400) {
      return { ok: false, error: FIX_FIELDS_MESSAGE, fieldErrors: error.fieldErrors as never };
    }
    if (error.status === 409) {
      return error.message.includes("email")
        ? { ok: false, error: FIX_FIELDS_MESSAGE, fieldErrors: { email: error.message } as never }
        : { ok: false, error: error.message };
    }
  }
  console.error("[users] write failed", error);
  return { ok: false, error: "Couldn't save the user. Please try again." };
}
