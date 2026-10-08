import { cn } from "@repo/ui/cn";

interface Props {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone?: "neutral" | "destructive";
  children?: React.ReactNode;
}

/**
 * The shared shape for empty, no-results and error panels.
 *
 * One component so every one of them keeps the same height and rhythm — swapping between them
 * must not shift the surrounding layout.
 */
export function StatePanel({ icon, title, description, tone = "neutral", children }: Props) {
  return (
    <div className="grid place-items-center gap-1.5 px-6 py-14 text-center">
      <div
        aria-hidden="true"
        className={cn(
          "mb-1 grid size-10 place-items-center rounded-full",
          tone === "destructive"
            ? "bg-destructive/10 text-destructive"
            : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
