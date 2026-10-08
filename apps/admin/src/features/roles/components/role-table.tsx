import Link from "next/link";
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
import { pluralize } from "@repo/ui/format";
import type { RoleRow } from "@/features/roles/services";

export function RoleTable({ rows }: { rows: readonly RoleRow[] }) {
  return (
    <table role="table" className={TABLE}>
      <caption role="caption" className={TABLE_CAPTION}>
        {pluralize(rows.length, "role", "roles")}
      </caption>
      <thead role="rowgroup" className={TABLE_HEAD}>
        <tr role="row" className={TABLE_HEAD_ROW}>
          <th scope="col" role="columnheader" className={TABLE_HEAD_CELL}>
            Role
          </th>
          <th scope="col" role="columnheader" className={TABLE_HEAD_CELL}>
            Description
          </th>
          <th scope="col" role="columnheader" className={`${TABLE_HEAD_CELL} md:text-right`}>
            Permissions
          </th>
          <th scope="col" role="columnheader" className={`${TABLE_HEAD_CELL} md:text-right`}>
            Users
          </th>
          <th scope="col" role="columnheader" className={`${TABLE_HEAD_CELL} md:text-right`}>
            Actions
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup" className={TABLE_BODY}>
        {rows.map((row) => (
          <tr key={row.id} role="row" className={TABLE_ROW}>
            <td role="cell" className={`${TABLE_CELL_LEAD} font-mono font-semibold`}>
              {row.name}
            </td>
            <td
              role="cell"
              className={`${TABLE_CELL} text-muted-foreground`}
              data-label="Description"
            >
              {row.description ?? "—"}
            </td>
            <td
              role="cell"
              className={`${TABLE_CELL} tabular-nums md:text-right`}
              data-label="Permissions"
            >
              {row.permissionCount}
            </td>
            <td
              role="cell"
              className={`${TABLE_CELL} tabular-nums md:text-right`}
              data-label="Users"
            >
              {row.userCount}
            </td>
            <td role="cell" className={`${TABLE_CELL_LEAD} max-md:mt-2`}>
              <span className="flex md:justify-end">
                <Link
                  href={`/roles/${row.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Manage
                  {/* Every row has a "Manage" link; the name tells them apart in a screen
                      reader's element list. */}
                  <span className="sr-only"> {row.name}</span>
                </Link>
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
