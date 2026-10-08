import Link from "next/link";

interface Props {
  title: string;
  description: string;
  children: React.ReactNode;
  /** The other door — "no account yet?" under sign-in, and the reverse under register. */
  footerPrompt: string;
  footerHref: string;
  footerLabel: string;
}

/**
 * The frame the sign-in and register forms sit in.
 *
 * Shared so the two pages cannot drift apart in width, spacing or the position of the link
 * between them — a shopper bouncing between "sign in" and "create account" should see the box
 * stay still.
 */
export function AuthCard({
  title,
  description,
  children,
  footerPrompt,
  footerHref,
  footerLabel,
}: Props) {
  return (
    <div className="mx-auto w-full max-w-sm py-10 md:py-16">
      <div className="rounded-2xl border border-border bg-card p-7">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">{description}</p>
        {children}
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {footerPrompt}{" "}
        <Link
          href={footerHref}
          className="rounded font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {footerLabel}
        </Link>
      </p>
    </div>
  );
}
