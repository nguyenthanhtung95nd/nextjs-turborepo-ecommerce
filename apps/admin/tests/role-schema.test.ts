import { describe, expect, it } from "vitest";
import { type RoleFormInput, permissionAssignmentSchema, roleFormSchema } from "@repo/contracts";

const VALID: RoleFormInput = { name: "CATALOG_EDITOR", description: "Manage the catalog" };

function firstErrorFor(input: RoleFormInput, field: keyof RoleFormInput) {
  const result = roleFormSchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("roleFormSchema", () => {
  it("accepts a well-formed role and trims it", () => {
    const result = roleFormSchema.safeParse({ name: " SUPER_ADMIN ", description: "  Full  " });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: "SUPER_ADMIN", description: "Full" });
  });

  it.each(["SUPER_ADMIN", "USER_MANAGER", "A", "ROLE_2", "A_B_C"])("accepts %s", (name) => {
    expect(roleFormSchema.safeParse({ ...VALID, name }).success).toBe(true);
  });

  // Role names are read as constants in code and appear in URLs, so the shape is constrained.
  it.each([
    "catalog_editor",
    "Catalog_Editor",
    "CATALOG EDITOR",
    "CATALOG-EDITOR",
    "_LEADING",
    "TRAILING_",
    "DOUBLE__UNDERSCORE",
    "2FAST",
  ])("rejects the name %s", (name) => {
    expect(firstErrorFor({ ...VALID, name }, "name")).toBeDefined();
  });

  it("requires a name", () => {
    expect(firstErrorFor({ ...VALID, name: "   " }, "name")).toMatch(/required/i);
  });

  it("accepts an empty description — the column is nullable", () => {
    expect(roleFormSchema.safeParse({ ...VALID, description: "" }).success).toBe(true);
  });

  it("rejects an over-long name or description", () => {
    expect(firstErrorFor({ ...VALID, name: "A".repeat(61) }, "name")).toBeDefined();
    expect(firstErrorFor({ ...VALID, description: "x".repeat(201) }, "description")).toBeDefined();
  });
});

describe("permissionAssignmentSchema", () => {
  it("accepts an empty set, which strips every permission", () => {
    expect(permissionAssignmentSchema.safeParse({ permissionIds: [] }).success).toBe(true);
  });

  it.each([["abc"], ["1.5"], ["-1"], [""], ["1 OR 1=1"]])("rejects the id %s", (id) => {
    expect(permissionAssignmentSchema.safeParse({ permissionIds: ["1", id] }).success).toBe(false);
  });
});
