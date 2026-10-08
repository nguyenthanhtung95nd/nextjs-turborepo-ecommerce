import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Props {
  label: string;
  value: number;
  /** One short line under the number, e.g. "3 staff". */
  detail?: string;
  href: string;
  linkLabel: string;
}

export function CountCard({ label, value, detail, href, linkLabel }: Props) {
  return (
    <section
      aria-label={label}
      className="flex flex-col rounded-lg border border-border bg-card p-4"
    >
      <h2 className="text-sm font-medium text-muted-foreground">{label}</h2>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
      {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {linkLabel}
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </section>
  );
}
