import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@repo/auth";
import { apiFetch } from "@repo/api-client";
import type { CurrentUserDto } from "@repo/contracts";
import { NEXT_PARAM } from "@/lib/auth/safe-redirect";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { SignOutButton } from "@/components/account/sign-out-button";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

const ACCOUNT_PATH = "/account";

/*
 * No `loading.tsx` for this route, deliberately — the same reason as the product detail and
 * landing pages. A Suspense boundary starts the response streaming, and a redirect cannot be
 * issued once the headers are gone, so an anonymous visitor would get a 200 and a flash of the
 * account page before being moved on.
 */

/**
 * The account area.
 *
 * The API identifies the caller from the token, so nothing here can be pointed at another
 * account. The redirect is not the protection: the server action behind the form re-checks for
 * itself, because it is a public endpoint whatever this page does.
 */
export default async function AccountPage() {
  const session = await auth();
  const token = session?.user?.accessToken;

  // Anonymous visitors are sent to sign in and then back here, so a bookmarked account page
  // survives an expired session without dumping someone on the home page.
  if (!token) redirect(`/login?${NEXT_PARAM}=${encodeURIComponent(ACCOUNT_PATH)}`);

  // The API answers 401 once the account is deactivated, even with a token still in date.
  let profile: CurrentUserDto;
  try {
    profile = await apiFetch<CurrentUserDto>("/auth/me", { token });
  } catch {
    redirect(`/login?${NEXT_PARAM}=${encodeURIComponent(ACCOUNT_PATH)}`);
  }

  return (
    <div className="py-6 md:py-10">
      <div className="flex flex-wrap items-start gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Your account</h1>
          <p className="mt-1 text-muted-foreground">{profile.email}</p>
        </div>
        <div className="ml-auto">
          <SignOutButton />
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <section aria-label="Profile">
          <h2 className="mb-3 text-lg font-bold">Profile</h2>
          <dl className="grid gap-x-6 gap-y-2.5 text-[15px] sm:grid-cols-[8rem_minmax(0,1fr)]">
            <dt className="text-muted-foreground">Name</dt>
            <dd>{profile.name ?? <span className="text-muted-foreground">Not set</span>}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="break-words">{profile.email}</dd>
          </dl>
        </section>

        <section aria-label="Change password">
          <h2 className="mb-3 text-lg font-bold">Change password</h2>
          <ChangePasswordForm email={profile.email} />
        </section>
      </div>
    </div>
  );
}
