"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@repo/api-client";
import { signInWithPassword, signOutOfSession } from "../services";

/**
 * Signs in, then hands the browser to the app.
 *
 * `refresh()` is what makes the new cookie visible: every page above is a Server Component, and
 * without it they would re-render from the cache taken before there was a session.
 */
export function useSignIn() {
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      signInWithPassword(credentials.email, credentials.password),
    onSuccess: () => {
      router.push("/");
      router.refresh();
    },
  });
}

export function useSignOut() {
  const router = useRouter();

  return useMutation({
    mutationFn: signOutOfSession,
    onSuccess: () => {
      router.push("/login");
      router.refresh();
    },
  });
}

/** One message for every cause, so the form never reveals whether an email exists. */
export function toSignInMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 400) return error.message;
  if (error instanceof ApiError && error.status === 401) return "Invalid email or password.";
  console.error("[auth] sign-in failed", error);
  return "Couldn't sign you in. Please try again.";
}
