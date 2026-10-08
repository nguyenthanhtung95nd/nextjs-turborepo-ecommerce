"use client";

import type { ComponentProps } from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { type VariantProps, cva } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;
export const SheetDescription = SheetPrimitive.Description;

function SheetOverlay({ className, ...props }: ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      className={cn("fixed inset-0 z-50 bg-black/50", className)}
      {...props}
    />
  );
}

const sheetVariants = cva("fixed z-50 flex flex-col bg-background shadow-lg focus:outline-none", {
  variants: {
    side: {
      left: "inset-y-0 left-0 h-full w-72 border-r border-border",
      right: "inset-y-0 right-0 h-full w-72 border-l border-border",
    },
  },
  defaultVariants: { side: "left" },
});

type SheetContentProps = ComponentProps<typeof SheetPrimitive.Content> &
  VariantProps<typeof sheetVariants>;

export function SheetContent({ side = "left", className, children, ...props }: SheetContentProps) {
  return (
    <SheetPrimitive.Portal>
      <SheetOverlay />
      <SheetPrimitive.Content
        tabIndex={-1}
        // Radix's own open-focus only considers form controls, so a drawer built from links drops
        // the user onto whichever input happens to sit in the middle of it — past content they
        // never knew was there. Focusing the panel instead announces its title and makes Tab walk
        // the drawer from the top. Declared before the spread so a caller can still override it.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.focus();
        }}
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export function SheetTitle({ className, ...props }: ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title className={cn("text-sm font-semibold", className)} {...props} />;
}
