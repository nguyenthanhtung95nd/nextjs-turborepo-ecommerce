import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, isSessionActive } from "@repo/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: true },
};

export default async function RegisterPage() {
  const session = await auth();
  // Same reason as the sign-in page: a stale cookie must not redirect in a circle.
  if (session?.user && (await isSessionActive(session))) redirect("/account");

  return (
    <AuthCard
      title="Create account"
      description="One account for your orders and details."
      footerPrompt="Already have an account?"
      footerHref="/login"
      footerLabel="Sign in"
    >
      <RegisterForm />
    </AuthCard>
  );
}
