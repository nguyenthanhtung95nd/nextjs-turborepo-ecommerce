import Link from "next/link";
import { Avatar, AvatarFallback } from "@repo/ui/avatar";
import { Badge } from "@repo/ui/badge";
import { buttonVariants } from "@repo/ui/button";
import {
  TABLE,
  TABLE_BODY,
  TABLE_CAPTION,
  TABLE_CELL,
  TABLE_CELL_LEAD,
  TABLE_HEAD,
  TABLE_HEAD_CELL,
  TABLE_HEAD_ROW,
  TABLE_ROW,
} from "@/components/responsive-table";
import { formatDate } from "@repo/ui/format";
import type { UserRow } from "@/features/users/services";
import { pluralize } from "@repo/ui/format";

/** Two letters from the name, or the email when there is no name yet. */
function initialsFor(user: UserRow): string {
  return (user.name ?? user.email).slice(0, 2).toUpperCase();
}

function RoleList({ roleNames }: { roleNames: readonly string[] }) {
  if (roleNames.length === 0) {
    // No role at all is what makes someone a customer rather than staff — worth saying, not
    // leaving as a blank cell the reader has to interpret.
    return <span className="text-xs text-muted-foreground">No roles (customer)</span>;
  }
  return (
    <span className="flex flex-wrap justify-end gap-1 md:justify-start">
      {roleNames.map((name) => (
        <Badge key={name} tone="muted">
          {name}
        </Badge>
      ))}
    </span>
  );
}

export function UserTable({ rows, total }: { rows: readonly UserRow[]; total: number }) {
  return (
    <table role="table" className={TABLE}>
      <caption role="caption" className={TABLE_CAPTION}>
        {rows.length} of {pluralize(total, "user", "users")}
      </caption>
      <thead role="rowgroup" className={TABLE_HEAD}>
        <tr role="row" className={TABLE_HEAD_ROW}>
          <th scope="col" role="columnheader" className={TABLE_HEAD_CELL}>
            User
          </th>
          <th scope="col" role="columnheader" className={TABLE_HEAD_CELL}>
            Roles
          </th>
          <th scope="col" role="columnheader" className={TABLE_HEAD_CELL}>
            Status
          </th>
          <th scope="col" role="columnheader" className={TABLE_HEAD_CELL}>
            Joined
          </th>
          <th scope="col" role="columnheader" className={`${TABLE_HEAD_CELL} md:text-right`}>
            Actions
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup" className={TABLE_BODY}>
        {rows.map((row) => (
          <tr key={row.id} role="row" className={TABLE_ROW}>
            <td role="cell" className={TABLE_CELL_LEAD}>
              <span className="flex items-center gap-2.5">
                <Avatar>
                  <AvatarFallback>{initialsFor(row)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <Link
                    href={`/users/${row.id}`}
                    className="font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {row.name ?? row.email}
                  </Link>
                  <span className="block truncate text-xs text-muted-foreground">{row.email}</span>
                </span>
              </span>
            </td>
            <td role="cell" className={TABLE_CELL} data-label="Roles">
              <RoleList roleNames={row.roleNames} />
            </td>
            <td role="cell" className={TABLE_CELL} data-label="Status">
              <Badge tone={row.isActive ? "success" : "muted"}>
                {row.isActive ? "Active" : "Deactivated"}
              </Badge>
            </td>
            <td role="cell" className={`${TABLE_CELL} whitespace-nowrap`} data-label="Joined">
              <time dateTime={row.createdAt.toISOString()}>{formatDate(row.createdAt)}</time>
            </td>
            <td role="cell" className={`${TABLE_CELL} max-md:mt-2 max-md:block`}>
              <span className="flex justify-end">
                <Link
                  href={`/users/${row.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Manage
                  {/* Every row has a "Manage" link; the name tells them apart in a screen
                      reader's element list. */}
                  <span className="sr-only"> {row.name ?? row.email}</span>
                </Link>
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
