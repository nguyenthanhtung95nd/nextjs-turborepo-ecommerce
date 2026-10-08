"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Panel } from "@/components/panel";
import { useSetUserActive } from "../api/use-users";
import { toUserFailure } from "../errors";
import { runWrite } from "@repo/ui/action-result";

interface Props {
  userId: string;
  isActive: boolean;
  /** True when this is the signed-in admin's own record. */
  isSelf: boolean;
}

export function UserStatusPanel({ userId, isActive, isSelf }: Props) {
  const setActive = useSetUserActive(userId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    setError(null);
    startTransition(async () => {
      const result = await runWrite(() => setActive.mutateAsync(!isActive), toUserFailure);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <Panel title="Status">
      <div className="flex items-center gap-3">
        <Badge tone={isActive ? "success" : "muted"}>{isActive ? "Active" : "Deactivated"}</Badge>
        <span className="text-sm text-muted-foreground">
          {isActive ? "Can sign in." : "Cannot sign in."}
        </span>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {isSelf ? (
        // The server refuses this anyway; not offering the button avoids a pointless dead end.
        <p className="text-sm text-muted-foreground">
          This is your own account — another admin has to deactivate it.
        </p>
      ) : (
        <Button
          variant={isActive ? "outline" : "primary"}
          onClick={toggle}
          disabled={isPending}
          className="justify-self-start"
        >
          {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {isActive ? "Deactivate account" : "Reactivate account"}
        </Button>
      )}

      {isActive && !isSelf && (
        <p className="text-xs text-muted-foreground">
          Deactivating blocks future sign-ins. A session they already have stays valid until it
          expires.
        </p>
      )}
    </Panel>
  );
}
