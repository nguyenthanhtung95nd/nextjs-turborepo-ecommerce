import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoleChecklist } from "@/features/users/components/role-checklist";
import type { RoleOption } from "@/features/users/services";

const ROLES: RoleOption[] = [
  { id: "1", name: "SUPER_ADMIN", description: "Full access" },
  { id: "2", name: "CATALOG_EDITOR", description: "Products and catalog" },
  { id: "3", name: "USER_MANAGER", description: null },
];

function renderChecklist(overrides: Partial<Parameters<typeof RoleChecklist>[0]> = {}) {
  const onToggle = vi.fn();
  render(
    <RoleChecklist
      legend="Assigned roles"
      roles={ROLES}
      selectedIds={[]}
      onToggle={onToggle}
      {...overrides}
    />,
  );
  return { onToggle };
}

describe("RoleChecklist", () => {
  it("offers every role as a checkbox named after it", () => {
    renderChecklist();
    for (const role of ROLES) {
      expect(screen.getByRole("checkbox", { name: new RegExp(role.name) })).toBeInTheDocument();
    }
  });

  it("ticks exactly the assigned roles", () => {
    renderChecklist({ selectedIds: ["2"] });
    expect(screen.getByRole("checkbox", { name: /CATALOG_EDITOR/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /SUPER_ADMIN/ })).not.toBeChecked();
  });

  it("reports an addition and a removal with the right id", async () => {
    const { onToggle } = renderChecklist({ selectedIds: ["2"] });

    await userEvent.click(screen.getByRole("checkbox", { name: /SUPER_ADMIN/ }));
    expect(onToggle).toHaveBeenCalledWith("1", true);

    await userEvent.click(screen.getByRole("checkbox", { name: /CATALOG_EDITOR/ }));
    expect(onToggle).toHaveBeenCalledWith("2", false);
  });

  it("shows a role's description so the choice can be made from the list", () => {
    renderChecklist();
    expect(screen.getByText("Full access")).toBeInTheDocument();
  });

  // A role with no description must still render — the column is nullable.
  it("renders a role that has no description", () => {
    renderChecklist();
    expect(screen.getByRole("checkbox", { name: /USER_MANAGER/ })).toBeInTheDocument();
  });

  it("refuses input while a save is in flight", async () => {
    const { onToggle } = renderChecklist({ disabled: true });
    const checkbox = screen.getByRole("checkbox", { name: /SUPER_ADMIN/ });

    expect(checkbox).toBeDisabled();
    await userEvent.click(checkbox);
    expect(onToggle).not.toHaveBeenCalled();
  });

  // The empty state the e2e suite cannot reach: deleting every role would break the suite.
  it("explains itself when no roles exist at all", () => {
    renderChecklist({ roles: [] });
    expect(screen.getByText(/no roles exist yet/i)).toBeInTheDocument();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });
});
