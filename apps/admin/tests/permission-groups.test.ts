import { describe, expect, it } from "vitest";
import { PERMISSIONS } from "@repo/auth/permissions";
import { type PermissionOption, groupPermissions } from "@/features/roles/permission-groups";

function option(key: string, id = key): PermissionOption {
  return { id, key, description: null };
}

/** The real catalog, in the shape the database hands back. */
const CATALOG = PERMISSIONS.map((key, index) => option(key, String(index + 1)));

describe("groupPermissions", () => {
  it("puts the whole seeded catalog under three headings", () => {
    expect(groupPermissions(CATALOG).map((group) => group.label)).toEqual([
      "Products",
      "Catalog",
      "Administration",
    ]);
  });

  it("loses no permission along the way", () => {
    const grouped = groupPermissions(CATALOG).flatMap((group) => group.permissions);
    expect(grouped).toHaveLength(CATALOG.length);
    expect(new Set(grouped.map((p) => p.key))).toEqual(new Set(PERMISSIONS));
  });

  it("sorts keys within a group so the order never depends on the query", () => {
    const products = groupPermissions(CATALOG).find((group) => group.label === "Products");
    expect(products?.permissions.map((p) => p.key)).toEqual([
      "product:create",
      "product:delete",
      "product:read",
      "product:update",
    ]);
  });

  // A permission added to the catalog must stay visible even before this file knows about it.
  it("files an unknown prefix under Other, after the known groups", () => {
    const grouped = groupPermissions([...CATALOG, option("report:view")]);
    expect(grouped.at(-1)?.label).toBe("Other");
    expect(grouped.at(-1)?.permissions.map((p) => p.key)).toEqual(["report:view"]);
  });

  it("treats a key with no colon as its own prefix", () => {
    const grouped = groupPermissions([option("everything")]);
    expect(grouped).toEqual([{ label: "Other", permissions: [option("everything")] }]);
  });

  it("emits no heading for a group with nothing in it", () => {
    const grouped = groupPermissions([option("user:manage")]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.label).toBe("Administration");
  });

  it("returns nothing for an empty catalog", () => {
    expect(groupPermissions([])).toEqual([]);
  });
});
