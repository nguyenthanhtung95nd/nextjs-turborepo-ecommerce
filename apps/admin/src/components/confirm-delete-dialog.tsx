"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/dialog";

/** Only the outcome matters to this dialog — field errors belong to forms. */
type DeleteOutcome = { ok: true } | { ok: false; error: string };

interface Props {
  title: string;
  description: string;
  confirmLabel: string;
  /** The button that opens the dialog — passed in so each caller styles its own affordance. */
  trigger: React.ReactNode;
  /** A server action already bound to the record being deleted. */
  action: () => Promise<DeleteOutcome>;
  /** Where to go once the record is gone. Omit to stay put and let the list revalidate. */
  redirectTo?: string;
}

/**
 * Confirmation step for an irreversible delete.
 *
 * On failure the dialog stays open and says why — the server is the only thing that knows
 * whether a delete is actually allowed, so the user must see its answer rather than be left
 * guessing whether anything happened.
 */
export function ConfirmDeleteDialog({
  title,
  description,
  confirmLabel,
  trigger,
  action,
  redirectTo,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setError(null);
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {error && (
          <p
            role="alert"
            className="mx-5 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {isPending ? "Deleting…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
