import { ApiError } from "@repo/api-client";
import type { ChangePasswordInput } from "@repo/contracts";
import { type ActionResult, FIX_FIELDS_MESSAGE } from "@repo/ui/action-result";

const SIGN_IN_AGAIN = "You need to sign in again.";

/** A wrong current password is an expected answer, so it lands on that field rather than the form. */
export function toPasswordFailure(error: unknown): ActionResult<ChangePasswordInput> {
  if (error instanceof ApiError && error.status === 409) {
    return {
      ok: false,
      error: FIX_FIELDS_MESSAGE,
      fieldErrors: { currentPassword: "That isn't your current password." },
    };
  }
  if (error instanceof ApiError && error.status === 401) {
    return { ok: false, error: SIGN_IN_AGAIN };
  }
  console.error("[account] password change failed", error);
  return { ok: false, error: "Couldn't change your password. Please try again." };
}
