import Link from "next/link";
import { X } from "lucide-react";
import type { UserListParams, UserStatusFilter } from "@repo/contracts";
import { hasActiveFilters, usersHref } from "@/features/users/url";

const STATUS_LABELS: Record<UserStatusFilter, string> = {
  ALL: "Any status",
  ACTIVE: "Active",
  INACTIVE: "Deactivated",
};

interface ChipProps {
  label: string;
  clearLabel: string;
  href: string;
}

function Chip({ label, clearLabel, href }: ChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted py-1 pl-3 pr-1 text-xs">
      {label}
      <Link
        href={href}
        aria-label={clearLabel}
        className="rounded-full p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-3.5" aria-hidden="true" />
      </Link>
    </span>
  );
}

/** Plain links, so each chip is a real navigation that works without JavaScript. */
export function UserFilterChips({ params }: { params: UserListParams }) {
  if (!hasActiveFilters(params)) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span>Active filters:</span>
      {params.q !== "" && (
        <Chip
          label={`search: “${params.q}”`}
          clearLabel="Clear the search filter"
          href={usersHref(params, { q: "", page: 1 })}
        />
      )}
      {params.role !== "" && (
        <Chip
          label={`role: ${params.role}`}
          clearLabel="Clear the role filter"
          href={usersHref(params, { role: "", page: 1 })}
        />
      )}
      {params.status !== "ALL" && (
        <Chip
          label={`status: ${STATUS_LABELS[params.status]}`}
          clearLabel="Clear the status filter"
          href={usersHref(params, { status: "ALL", page: 1 })}
        />
      )}
      <Link
        href={usersHref(params, { q: "", role: "", status: "ALL", page: 1 })}
        className="rounded px-1.5 py-0.5 font-medium underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Clear all
      </Link>
    </div>
  );
}
