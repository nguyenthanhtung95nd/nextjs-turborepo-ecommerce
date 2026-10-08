"use client";

import { type PermissionOption, groupPermissions } from "@/features/roles/permission-groups";

interface Props {
  permissions: readonly PermissionOption[];
  selectedIds: readonly string[];
  onToggle: (permissionId: string, checked: boolean) => void;
  disabled?: boolean;
}

/**
 * The permission catalog with this role's permissions ticked.
 *
 * Grouped by what each permission acts on, because the question being answered is "what can
 * this role do to products?", not "what comes after product:create alphabetically".
 */
export function PermissionChecklist({ permissions, selectedIds, onToggle, disabled }: Props) {
  if (permissions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        The permission catalog is empty. It is seeded from the application&rsquo;s code.
      </p>
    );
  }

  return (
    <div className="grid max-w-2xl gap-5">
      {groupPermissions(permissions).map((group) => (
        <fieldset key={group.label} className="grid gap-2" disabled={disabled}>
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </legend>
          {group.permissions.map((permission) => {
            const inputId = `permission-${permission.id}`;
            return (
              <label
                key={permission.id}
                htmlFor={inputId}
                className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border p-3 hover:bg-muted has-checked:border-primary/40 has-checked:bg-primary/5"
              >
                <input
                  id={inputId}
                  type="checkbox"
                  className="mt-0.5 size-4 accent-primary"
                  checked={selectedIds.includes(permission.id)}
                  onChange={(event) => onToggle(permission.id, event.target.checked)}
                />
                <span className="min-w-0">
                  <span className="block font-mono text-sm font-medium">{permission.key}</span>
                  {permission.description && (
                    <span className="block text-xs text-muted-foreground">
                      {permission.description}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </fieldset>
      ))}
    </div>
  );
}
