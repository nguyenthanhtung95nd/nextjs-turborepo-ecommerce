"use server";

import { AuthError, signIn, signOut } from "@repo/auth";
import { ApiError, apiFetch } from "@repo/api-client";
import { type RegisterInput, registerSchema } from "@repo/contracts";
import { zodFieldErrors } from "@repo/ui/action-result";
import { safeRedirect } from "./safe-redirect";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** React 19 resets an uncontrolled form after its action runs; these refill it. Never a password. */
  values?: { email?: string; name?: string };
}

/**
 * Credentials sign-in, driven by the form's own `FormData` so it posts without JavaScript.
 *
 * Every failure returns one generic message, so the form cannot reveal whether an email exists.
 */
export async function authenticate(_previous: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirect(String(formData.get("next") ?? ""));
  const values = { email };

  if (!email || !password) return { error: "Enter your email and password.", values };

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Invalid email or password.", values };
    throw error;
  }

  return {};
}

/**
 * Creates a customer account and signs them straight in.
 *
 * The new account gets no roles, so registering here can never open the back office.
 */
export async function register(_previous: FormState, formData: FormData): Promise<FormState> {
  const input: RegisterInput = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
  const values = { name: input.name, email: input.email };

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const result = zodFieldErrors<RegisterInput>(parsed.error);
    return result.ok ? {} : { error: result.error, fieldErrors: result.fieldErrors, values };
  }

  try {
    await apiFetch("/auth/register", { method: "POST", body: parsed.data });
  } catch (error) {
    // Registration cannot hide a taken email the way sign-in hides an unknown one: the account
    // either gets created or it does not.
    if (error instanceof ApiError && error.status === 409) {
      return {
        error: "Please fix the highlighted fields.",
        fieldErrors: { email: "An account with that email already exists." },
        values,
      };
    }
    console.error("[auth] registration failed", error);
    return { error: "Couldn't create your account. Please try again.", values };
  }

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/account",
  });
  return {};
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
