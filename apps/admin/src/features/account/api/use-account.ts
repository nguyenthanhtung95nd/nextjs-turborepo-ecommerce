"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { ChangePasswordInput } from "@repo/contracts";
import { changeOwnPassword, fetchAccountOverview } from "../services";

export function useAccountOverview() {
  return useQuery({ queryKey: ["account", "overview"], queryFn: fetchAccountOverview });
}

/**
 * Changing a password does not alter anything else on screen, so nothing is invalidated —
 * inventing an invalidation here would only cost a request.
 */
export function useChangePassword() {
  return useMutation({ mutationFn: (input: ChangePasswordInput) => changeOwnPassword(input) });
}
