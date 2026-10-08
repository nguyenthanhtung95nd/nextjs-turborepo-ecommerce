"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@repo/auth";
import { ApiError, apiFetch } from "@repo/api-client";
import { type ChangePasswordInput, changePasswordSchema } from "@repo/contracts";
import { type ActionResult, FIX_FIELDS_MESSAGE, zodFieldErrors } from "@repo/ui/action-result";

const ACCOUNT_ROUTE = "/account";
const SIGN_IN_AGAIN = "You need to sign in again.";

/**
 * Changes the signed-in shopper's own password.
 *
 * The API identifies the caller from the token, so this cannot be pointed at someone else.
 */
export async function changeOwnPassword(
  input: ChangePasswordInput,
): Promise<ActionResult<ChangePasswordInput>> {
  const session = await auth();
  const token = session?.user?.accessToken;
  if (!token) return { ok: false, error: SIGN_IN_AGAIN };

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return zodFieldErrors<ChangePasswordInput>(parsed.error);

  try {
    await apiFetch("/auth/change-password", { method: "POST", body: parsed.data, token });
  } catch (error) {
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

  revalidatePath(ACCOUNT_ROUTE);
  return { ok: true };
}
