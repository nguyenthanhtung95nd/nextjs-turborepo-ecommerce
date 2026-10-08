"use client";

import { AlertTriangle } from "lucide-react";
import { formatDate } from "@repo/ui/format";
import { Button } from "@repo/ui/button";
import { Panel } from "@/components/panel";
import { StatePanel } from "@/components/state-panel";
import { TABLE_SURFACE } from "@/components/responsive-table";
import { useAccountOverview } from "../api/use-account";
import { AccessPanel } from "./access-panel";
import { AccountSkeleton } from "./account-skeleton";
import { ChangePasswordForm } from "./change-password-form";

export function AccountScreen() {
  const account = useAccountOverview();

  if (account.isPending) return <AccountSkeleton />;

  if (account.isError) {
    return (
      <div className={TABLE_SURFACE}>
        <StatePanel
          tone="destructive"
          icon={<AlertTriangle className="size-5" />}
          title="Couldn't load your account"
          description="Something went wrong on our side. The details have been logged — try again in a moment."
        >
          <Button variant="outline" onClick={() => void account.refetch()}>
            Try again
          </Button>
        </StatePanel>
      </div>
    );
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">{account.data.email}</p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 gap-5">
          <ChangePasswordForm />
        </div>

        <aside className="grid min-w-0 gap-5">
          <Panel title="Profile">
            <div className="grid gap-1.5">
              <span className="text-sm font-medium">Name</span>
              <p className="text-sm text-muted-foreground">{account.data.name ?? "Not set"}</p>
            </div>
            <div className="grid gap-1.5">
              <span className="text-sm font-medium">Email</span>
              <p className="text-sm text-muted-foreground">{account.data.email}</p>
            </div>
            <div className="grid gap-1.5">
              <span className="text-sm font-medium">Joined</span>
              <p className="text-sm text-muted-foreground">{formatDate(account.data.createdAt)}</p>
            </div>
            {/* Name and email are changed by a user manager, not here: email is the sign-in
                identity, and changing it is an account-recovery flow rather than a profile edit. */}
            <p className="text-xs text-muted-foreground">
              Ask a user manager to change your name or email.
            </p>
          </Panel>

          <AccessPanel account={account.data} />
        </aside>
      </div>
    </>
  );
}
