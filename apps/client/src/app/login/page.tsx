import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, isSessionActive } from "@repo/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { NEXT_PARAM, safeRedirect } from "@/lib/auth/safe-redirect";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: true },
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: Props) {
  const [session, query] = await Promise.all([auth(), searchParams]);

  const raw = query[NEXT_PARAM];
  const next = safeRedirect(typeof raw === "string" ? raw : null);

  // Only a session the API still accepts counts as signed in. A cookie that outlived its account
  // would otherwise bounce between here and the page that rejected it.
  if (session?.user && (await isSessionActive(session))) redirect(next);

  return (
    <AuthCard
      title="Sign in"
      description="Welcome back."
      footerPrompt="No account yet?"
      footerHref="/register"
      footerLabel="Create one"
    >
      <LoginForm next={next} />
    </AuthCard>
  );
}
