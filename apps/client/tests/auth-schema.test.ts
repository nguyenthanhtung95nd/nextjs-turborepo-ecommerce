import { describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH } from "@repo/auth/password";
import { changePasswordSchema, registerSchema } from "@repo/contracts";

const VALID_REGISTER = {
  name: "Sam Taylor",
  email: "sam@example.com",
  password: "correct-horse",
  confirmPassword: "correct-horse",
};

function registerErrorFor(field: string, input: Record<string, string>) {
  const result = registerSchema.safeParse(input);
  if (result.success) return null;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message ?? null;
}

describe("registerSchema", () => {
  it("accepts a complete registration", () => {
    expect(registerSchema.safeParse(VALID_REGISTER).success).toBe(true);
  });

  /**
   * The unique index is on the raw column, so without this "Sam@example.com" and
   * "sam@example.com" would become two accounts that both look like the same person.
   */
  it("lower-cases the email so one address cannot become two accounts", () => {
    const result = registerSchema.parse({ ...VALID_REGISTER, email: "Sam@Example.COM" });
    expect(result.email).toBe("sam@example.com");
  });

  it("trims surrounding whitespace from the email", () => {
    expect(registerSchema.parse({ ...VALID_REGISTER, email: "  sam@example.com " }).email).toBe(
      "sam@example.com",
    );
  });

  it.each([["not-an-email"], ["sam@"], ["@example.com"], [""]])(
    "rejects %p as an email",
    (email) => {
      expect(registerSchema.safeParse({ ...VALID_REGISTER, email }).success).toBe(false);
    },
  );

  it("requires the two passwords to match, and says so on the confirm field", () => {
    expect(
      registerErrorFor("confirmPassword", { ...VALID_REGISTER, confirmPassword: "different" }),
    ).toBe("The two passwords don't match.");
  });

  it("enforces the shared minimum password length", () => {
    const short = "x".repeat(MIN_PASSWORD_LENGTH - 1);
    const message = registerErrorFor("password", {
      ...VALID_REGISTER,
      password: short,
      confirmPassword: short,
    });
    expect(message).toContain(String(MIN_PASSWORD_LENGTH));
  });

  /** A name is genuinely optional — plenty of people would rather not give one. */
  it("accepts an empty name", () => {
    expect(registerSchema.safeParse({ ...VALID_REGISTER, name: "" }).success).toBe(true);
  });

  it("trims the name", () => {
    expect(registerSchema.parse({ ...VALID_REGISTER, name: "  Sam  " }).name).toBe("Sam");
  });
});

const VALID_CHANGE = {
  currentPassword: "old-password",
  newPassword: "a-new-password",
  confirmPassword: "a-new-password",
};

function changeErrorFor(field: string, input: Record<string, string>) {
  const result = changePasswordSchema.safeParse(input);
  if (result.success) return null;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message ?? null;
}

describe("changePasswordSchema", () => {
  it("accepts a valid change", () => {
    expect(changePasswordSchema.safeParse(VALID_CHANGE).success).toBe(true);
  });

  it("requires the current password", () => {
    expect(changeErrorFor("currentPassword", { ...VALID_CHANGE, currentPassword: "" })).toBe(
      "Enter your current password.",
    );
  });

  /**
   * Not length-checked: it is checked against the stored hash, and telling someone the password
   * they have been using for a year is "too short" on the way in is noise.
   */
  it("does not impose a length rule on the current password", () => {
    expect(changePasswordSchema.safeParse({ ...VALID_CHANGE, currentPassword: "x" }).success).toBe(
      true,
    );
  });

  it("rejects a new password that matches the old one", () => {
    expect(
      changeErrorFor("newPassword", {
        currentPassword: "same-password",
        newPassword: "same-password",
        confirmPassword: "same-password",
      }),
    ).toBe("Choose a password you aren't already using.");
  });

  it("requires the confirmation to match", () => {
    expect(
      changeErrorFor("confirmPassword", { ...VALID_CHANGE, confirmPassword: "mismatch" }),
    ).toBe("The two passwords don't match.");
  });

  it("enforces the shared minimum on the new password", () => {
    const short = "x".repeat(MIN_PASSWORD_LENGTH - 1);
    expect(
      changeErrorFor("newPassword", {
        ...VALID_CHANGE,
        newPassword: short,
        confirmPassword: short,
      }),
    ).toContain(String(MIN_PASSWORD_LENGTH));
  });
});
