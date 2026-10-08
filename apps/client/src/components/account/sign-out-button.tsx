import { signOutAction } from "@/lib/auth/actions";

/**
 * Sign out, as a form rather than a link.
 *
 * Signing out changes state, so it is a POST. A `<a href="/logout">` would be followed by link
 * prefetchers and antivirus scanners, which is how people end up mysteriously signed out.
 *
 * No client JavaScript: a Server Component rendering a form bound to a server action.
 */
export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Sign out
      </button>
    </form>
  );
}
