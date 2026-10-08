"use client";

import type { ComponentProps } from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "../lib/cn";

export function Avatar({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      className={cn("relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  );
}

export function AvatarImage({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image className={cn("aspect-square h-full w-full", className)} {...props} />
  );
}

export function AvatarFallback({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}
