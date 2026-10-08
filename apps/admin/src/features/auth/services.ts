import { apiClient } from "@/services/api-client";

export async function signInWithPassword(email: string, password: string): Promise<void> {
  await apiClient.post("/session", { email, password });
}

export async function signOutOfSession(): Promise<void> {
  await apiClient.delete("/session");
}
