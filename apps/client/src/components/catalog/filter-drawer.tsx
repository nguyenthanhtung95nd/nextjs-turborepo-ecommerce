"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@repo/ui/sheet";

interface Props {
  activeCount: number;
  /** The filter panel, rendered on the server and handed down — it never enters the client bundle. */
  children: React.ReactNode;
}

/**
 * The mobile home for the filter panel.
 *
 * This component is a client island only because a drawer needs open/closed state; the filters
 * inside it arrive as `children`, already rendered on the server, so none of their markup or data
 * ships as JavaScript.
 *
 * The trigger sits inside `<Sheet>` rather than toggling state from outside it, so Radix knows
 * which element opened the drawer and returns focus there on close.
 *
 * There is no "apply" button and no close handler: every filter is a link, so choosing one
 * navigates and the drawer goes with the old page.
 */
export function FilterDrawer({ activeCount, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          // Without this the badge is read as part of the name — "Filters 3" — which says
          // nothing about what the 3 counts. The badge itself is then decorative.
          aria-label={activeCount > 0 ? `Filters, ${activeCount} active` : "Filters"}
          className="flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filters
          {activeCount > 0 && (
            <span
              aria-hidden="true"
              className="grid size-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground"
            >
              {activeCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="w-80 overflow-y-auto p-0">
        <SheetTitle className="border-b border-border px-5 py-4 text-base font-semibold">
          Filters
        </SheetTitle>
        <div className="p-5">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
