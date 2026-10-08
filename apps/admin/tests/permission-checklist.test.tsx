import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PermissionChecklist } from "@/features/roles/components/permission-checklist";
import type { PermissionOption } from "@/features/roles/permission-groups";

const PERMISSIONS: PermissionOption[] = [
  { id: "1", key: "product:create", description: "Create products" },
  { id: "2", key: "product:read", description: "Read products" },
  { id: "3", key: "category:manage", description: "Manage categories" },
  { id: "4", key: "role:manage", description: "Manage roles" },
];

function renderChecklist(overrides: Partial<Parameters<typeof PermissionChecklist>[0]> = {}) {
  const onToggle = vi.fn();
  render(
    <PermissionChecklist
      permissions={PERMISSIONS}
      selectedIds={[]}
      onToggle={onToggle}
      {...overrides}
    />,
  );
  return { onToggle };
}

describe("PermissionChecklist", () => {
  it("files each permission under the heading for what it acts on", () => {
    renderChecklist();

    const products = screen.getByRole("group", { name: "Products" });
    expect(within(products).getByRole("checkbox", { name: /product:create/ })).toBeInTheDocument();
    expect(within(products).getByRole("checkbox", { name: /product:read/ })).toBeInTheDocument();

    const admin = screen.getByRole("group", { name: "Administration" });
    expect(within(admin).getByRole("checkbox", { name: /role:manage/ })).toBeInTheDocument();
  });

  it("ticks exactly the granted permissions", () => {
    renderChecklist({ selectedIds: ["1", "4"] });
    expect(screen.getByRole("checkbox", { name: /product:create/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /product:read/ })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /role:manage/ })).toBeChecked();
  });

  it("reports a grant and a revoke with the right id", async () => {
    const { onToggle } = renderChecklist({ selectedIds: ["4"] });

    await userEvent.click(screen.getByRole("checkbox", { name: /product:read/ }));
    expect(onToggle).toHaveBeenCalledWith("2", true);

    await userEvent.click(screen.getByRole("checkbox", { name: /role:manage/ }));
    expect(onToggle).toHaveBeenCalledWith("4", false);
  });

  it("refuses input while a save is in flight", async () => {
    const { onToggle } = renderChecklist({ disabled: true });
    await userEvent.click(screen.getByRole("checkbox", { name: /product:read/ }));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("says so when the catalog is empty rather than rendering nothing", () => {
    renderChecklist({ permissions: [] });
    expect(screen.getByText(/permission catalog is empty/i)).toBeInTheDocument();
  });
});
