/** Where someone lands after signing in when nothing else was asked for. */
export const DEFAULT_AFTER_SIGN_IN = "/account";

/** The query parameter carrying the page a shopper was trying to reach. */
export const NEXT_PARAM = "next";

/**
 * Narrows a caller-supplied redirect target to somewhere on this site.
 *
 * `/login?next=…` is attacker-controlled: anyone can mail a shopper a link whose `next` points at
 * their own site, and a redirect that honours it hands over a victim who has just typed their
 * password and has every reason to trust the page they land on.
 *
 * Only a path on this origin is allowed through:
 *
 * - it must start with a single `/` — `//evil.com` and `/\evil.com` are both browser-accepted
 *   ways of writing a protocol-relative URL, so one leading slash is not enough to check;
 * - it must not be absolute (`https://evil.com`, `javascript:…`), which the above already
 *   excludes, but control characters can smuggle a scheme past a naive check, so they are
 *   rejected outright;
 * - it must not be the sign-in page itself, which would bounce a shopper in a circle.
 *
 * @returns the target when it is safe, or `DEFAULT_AFTER_SIGN_IN` when it is missing or not.
 */
export function safeRedirect(target: string | null | undefined): string {
  if (!target) return DEFAULT_AFTER_SIGN_IN;

  // Control characters, including the tab/newline/CR that browsers strip from URLs before
  // parsing them — `/\tjavascript:alert(1)` is a real bypass of a "starts with /" check.
  if (/[\u0000-\u001F\u007F]/.test(target)) return DEFAULT_AFTER_SIGN_IN;

  if (!target.startsWith("/")) return DEFAULT_AFTER_SIGN_IN;
  if (target.startsWith("//") || target.startsWith("/\\")) return DEFAULT_AFTER_SIGN_IN;

  // Landing back on the sign-in page after signing in reads as a failure even though it worked.
  const path = target.split(/[?#]/)[0];
  if (path === "/login" || path === "/register") return DEFAULT_AFTER_SIGN_IN;

  return target;
}
