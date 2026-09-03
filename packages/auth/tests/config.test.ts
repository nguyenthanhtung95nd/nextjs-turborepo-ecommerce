import { describe, expect, it } from "vitest";
import { authConfig } from "../src/config";

// The callbacks carry the custom claim-mapping logic; test them directly (no NextAuth runtime).
const jwt = authConfig.callbacks!.jwt!;
const session = authConfig.callbacks!.session!;

describe("session callback", () => {
  it("copies userId + permissions from the token onto the session", async () => {
    const out = await session({
      session: { user: { email: "a@local.dev" } },
      token: { userId: "5", permissions: ["product:read"] },
    } as never);
    expect(out.user.id).toBe("5");
    expect(out.user.permissions).toEqual(["product:read"]);
  });

  it("defaults to empty id/permissions when the token has no claims", async () => {
    const out = await session({
      session: { user: { email: "a@local.dev" } },
      token: {},
    } as never);
    expect(out.user.id).toBe("");
    expect(out.user.permissions).toEqual([]);
  });
});

describe("jwt callback", () => {
  it("leaves the token unchanged when there is no user (i.e. not a fresh sign-in)", async () => {
    const token = { sub: "unchanged" };
    const out = await jwt({ token, user: undefined } as never);
    expect(out).toBe(token);
  });
});
