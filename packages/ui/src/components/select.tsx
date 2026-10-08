import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";

// A native <select>, not a Radix listbox: it is keyboard- and screen-reader-correct for free,
// renders the OS picker on mobile, and works inside an uncontrolled react-hook-form register().
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "flex h-9 w-full appearance-none rounded-md border border-border bg-background px-3 py-1 pr-9 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
