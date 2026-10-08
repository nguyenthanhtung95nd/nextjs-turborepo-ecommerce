import { describe, expect, it } from "vitest";
import { type ChangePasswordInput, changePasswordSchema } from "@repo/contracts";
import { MIN_PASSWORD_LENGTH } from "@repo/auth/password";

const VALID: ChangePasswordInput = {
  currentPassword: "old-password",
  newPassword: "a-brand-new-one",
  confirmPassword: "a-brand-new-one",
};

function firstErrorFor(input: ChangePasswordInput, field: keyof ChangePasswordInput) {
  const result = changePasswordSchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("changePasswordSchema", () => {
  it("accepts a well-formed change", () => {
    expect(changePasswordSchema.safeParse(VALID).success).toBe(true);
  });

  it("requires the current password", () => {
    expect(firstErrorFor({ ...VALID, currentPassword: "" }, "currentPassword")).toMatch(
      /current password/i,
    );
  });

  // Not length-checked: it is verified against the stored hash, and an existing password that
  // predates the rule must still be accepted as proof of identity.
  it("puts no length rule on the current password", () => {
    expect(firstErrorFor({ ...VALID, currentPassword: "x" }, "currentPassword")).toBeUndefined();
  });

  it(`rejects a new password shorter than ${MIN_PASSWORD_LENGTH} characters`, () => {
    const short = "x".repeat(MIN_PASSWORD_LENGTH - 1);
    const input = { ...VALID, newPassword: short, confirmPassword: short };
    expect(firstErrorFor(input, "newPassword")).toMatch(/at least/i);
  });

  it("rejects a confirmation that does not match", () => {
    expect(
      firstErrorFor({ ...VALID, confirmPassword: "something-else" }, "confirmPassword"),
    ).toMatch(/don't match/i);
  });

  it("rejects reusing the current password", () => {
    const same = "the-same-password";
    const input = { currentPassword: same, newPassword: same, confirmPassword: same };
    expect(firstErrorFor(input, "newPassword")).toMatch(/aren't already using/i);
  });

  it("reports a mismatch and a reuse independently", () => {
    const input = {
      currentPassword: "shared-secret",
      newPassword: "shared-secret",
      confirmPassword: "different",
    };
    expect(firstErrorFor(input, "newPassword")).toBeDefined();
    expect(firstErrorFor(input, "confirmPassword")).toBeDefined();
  });
});
