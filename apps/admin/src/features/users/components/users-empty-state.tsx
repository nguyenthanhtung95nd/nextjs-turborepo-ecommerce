import Link from "next/link";
import { SearchX, Users } from "lucide-react";
import { buttonVariants } from "@repo/ui/button";
import { StatePanel } from "@/components/state-panel";
import type { UserListParams } from "@repo/contracts";
import { hasActiveFilters, usersHref } from "@/features/users/url";

/**
 * "Nothing here" means two different things, and offering the wrong recovery is what makes an
 * empty screen feel broken.
 */
export function UsersEmptyState({ params }: { params: UserListParams }) {
  if (hasActiveFilters(params)) {
    return (
      <StatePanel
        icon={<SearchX className="size-5" />}
        title="No users match these filters"
        description="Nothing matches the current search, role and status. Try a different term or widen the filters."
      >
        <Link
          href={usersHref(params, { q: "", role: "", status: "ALL", page: 1 })}
          className={buttonVariants({ variant: "outline" })}
        >
          Clear all filters
        </Link>
      </StatePanel>
    );
  }

  // Only reachable before anyone has signed up at all — the signed-in admin is a user too.
  return (
    <StatePanel
      icon={<Users className="size-5" />}
      title="No users yet"
      description="Create a staff account to let someone else into the admin area."
    />
  );
}
