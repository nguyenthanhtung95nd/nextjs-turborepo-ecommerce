"use client";

import type { RoleOption } from "@/features/users/services";

interface Props {
  legend: string;
  roles: readonly RoleOption[];
  selectedIds: readonly string[];
  onToggle: (roleId: string, checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Every role in the system, with the assigned ones ticked.
 *
 * A checklist rather than a picker because the roles a user does *not* have are as much a part
 * of the decision as the ones they do, and each one's description is what explains the choice.
 */
export function RoleChecklist({ legend, roles, selectedIds, onToggle, disabled }: Props) {
  if (roles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No roles exist yet. Create one under Roles before assigning access.
      </p>
    );
  }

  return (
    // Capped: a checkbox row stretched across a wide screen puts its label and its edge far
    // apart, which reads as an empty band rather than a list item.
    <fieldset className="grid max-w-2xl gap-2" disabled={disabled}>
      <legend className="mb-1 text-sm font-medium">{legend}</legend>
      {roles.map((role) => {
        const inputId = `role-${role.id}`;
        return (
          <label
            key={role.id}
            htmlFor={inputId}
            className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border p-3 hover:bg-muted has-checked:border-primary/40 has-checked:bg-primary/5"
          >
            <input
              id={inputId}
              type="checkbox"
              className="mt-0.5 size-4 accent-primary"
              checked={selectedIds.includes(role.id)}
              onChange={(event) => onToggle(role.id, event.target.checked)}
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{role.name}</span>
              {role.description && (
                <span className="block text-xs text-muted-foreground">{role.description}</span>
              )}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
