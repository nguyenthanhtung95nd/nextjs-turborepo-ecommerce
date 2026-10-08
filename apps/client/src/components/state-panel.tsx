interface Props {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone?: "neutral" | "destructive";
  children?: React.ReactNode;
}

/**
 * The shared shape for empty and error panels.
 *
 * One component so both keep the same height and rhythm — swapping between them must not shift
 * the surrounding layout.
 */
export function StatePanel({ icon, title, description, tone = "neutral", children }: Props) {
  return (
    <div className="grid place-items-center gap-2 rounded-xl border border-border bg-card px-6 py-16 text-center">
      <span
        aria-hidden="true"
        className={tone === "destructive" ? "text-destructive" : "text-muted-foreground"}
      >
        {icon}
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-[44ch] text-muted-foreground">{description}</p>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
