import { describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH } from "@repo/auth/password";
import {
  type CreateUserInput,
  createUserSchema,
  roleAssignmentSchema,
  userListParamsSchema,
  userProfileSchema,
} from "@repo/contracts";

const VALID_USER: CreateUserInput = {
  email: "minh@local.dev",
  name: "Trần Minh",
  password: "correct-horse",
  roleIds: ["1", "3"],
};

function firstErrorFor(input: CreateUserInput, field: keyof CreateUserInput) {
  const result = createUserSchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("createUserSchema", () => {
  it("accepts a complete staff account", () => {
    expect(createUserSchema.safeParse(VALID_USER).success).toBe(true);
  });

  it("allows a user with no roles — that is a customer, not an error", () => {
    expect(createUserSchema.safeParse({ ...VALID_USER, roleIds: [] }).success).toBe(true);
  });

  it.each(["", "not-an-email", "missing@tld", "@local.dev", "a b@local.dev"])(
    "rejects the email %s",
    (email) => {
      expect(firstErrorFor({ ...VALID_USER, email }, "email")).toBeDefined();
    },
  );

  it(`rejects a password shorter than ${MIN_PASSWORD_LENGTH} characters`, () => {
    const short = "x".repeat(MIN_PASSWORD_LENGTH - 1);
    expect(firstErrorFor({ ...VALID_USER, password: short }, "password")).toMatch(/at least/i);
    expect(
      createUserSchema.safeParse({ ...VALID_USER, password: "x".repeat(MIN_PASSWORD_LENGTH) })
        .success,
    ).toBe(true);
  });

  // Role ids reach the server as strings from a form; anything else must not become a BigInt.
  it.each([["abc"], ["1.5"], ["-1"], [""], ["1; DROP TABLE users"]])(
    "rejects the role id %s",
    (roleId) => {
      expect(createUserSchema.safeParse({ ...VALID_USER, roleIds: [roleId] }).success).toBe(false);
    },
  );

  it("trims the name but keeps non-ASCII characters intact", () => {
    const result = createUserSchema.safeParse({ ...VALID_USER, name: "  Trần Minh  " });
    expect(result.data?.name).toBe("Trần Minh");
  });
});

describe("userProfileSchema", () => {
  it("accepts an empty name — the column is nullable", () => {
    expect(userProfileSchema.safeParse({ name: "" }).success).toBe(true);
  });

  it("rejects an over-long name", () => {
    expect(userProfileSchema.safeParse({ name: "x".repeat(81) }).success).toBe(false);
  });
});

describe("roleAssignmentSchema", () => {
  it("accepts an empty set, which strips every role", () => {
    expect(roleAssignmentSchema.safeParse({ roleIds: [] }).success).toBe(true);
  });

  it("rejects a non-numeric id", () => {
    expect(roleAssignmentSchema.safeParse({ roleIds: ["1", "x"] }).success).toBe(false);
  });
});

describe("userListParamsSchema", () => {
  it("falls back to defaults when the query string is empty", () => {
    expect(userListParamsSchema.parse({})).toEqual({ q: "", role: "", status: "ALL", page: 1 });
  });

  it("reads a fully specified query string", () => {
    expect(
      userListParamsSchema.parse({ q: " minh ", role: "SUPER_ADMIN", status: "ACTIVE", page: "2" }),
    ).toEqual({ q: "minh", role: "SUPER_ADMIN", status: "ACTIVE", page: 2 });
  });

  // A hand-edited or stale URL must degrade to the default view, never throw into error.tsx.
  it.each([
    [{ page: "0" }, "page", 1],
    [{ page: "banana" }, "page", 1],
    [{ page: "-7" }, "page", 1],
    [{ status: "BANNED" }, "status", "ALL"],
    [{ q: ["a", "b"] }, "q", ""],
    [{ role: ["a", "b"] }, "role", ""],
  ])("clamps %o", (input, field, expected) => {
    const parsed = userListParamsSchema.parse(input) as Record<string, unknown>;
    expect(parsed[field]).toBe(expected);
  });

  it("keeps an unknown role name — it simply matches no users", () => {
    expect(userListParamsSchema.parse({ role: "DELETED_ROLE" }).role).toBe("DELETED_ROLE");
  });
});
