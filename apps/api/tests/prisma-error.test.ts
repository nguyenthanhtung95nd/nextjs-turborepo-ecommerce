import { describe, expect, it } from "vitest";
import {
  FOREIGN_KEY_VIOLATION,
  UNIQUE_VIOLATION,
  prismaErrorCode,
  prismaErrorTarget,
} from "../src/prisma/prisma-error";

/** Shaped like what Prisma throws, but from no particular class — which is the whole point. */
function prismaLikeError(code: string, target?: string[]) {
  return { name: "PrismaClientKnownRequestError", code, meta: target ? { target } : undefined };
}

describe("prismaErrorCode", () => {
  // The regression this guards: the client is cached on globalThis across hot reloads, so a
  // thrown error can belong to a different module instance than the imported `Prisma` namespace
  // and `instanceof` quietly returns false. Matching on the code survives that.
  it("reads the code from an object of any class", () => {
    expect(prismaErrorCode(prismaLikeError(UNIQUE_VIOLATION))).toBe("P2002");
    expect(prismaErrorCode(prismaLikeError(FOREIGN_KEY_VIOLATION))).toBe("P2003");
  });

  it("reads the code off a real Error instance too", () => {
    const error = Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
    expect(prismaErrorCode(error)).toBe("P2002");
  });

  it.each([
    [new Error("boom")],
    [{ code: "ECONNREFUSED" }],
    [{ code: 42 }],
    [{ code: "P200" }],
    [{ code: "P20022" }],
    [null],
    [undefined],
    ["P2002"],
  ])("returns null for %o", (error) => {
    expect(prismaErrorCode(error)).toBeNull();
  });
});

describe("prismaErrorTarget", () => {
  it("exposes the violated columns as a searchable string", () => {
    expect(prismaErrorTarget(prismaLikeError(UNIQUE_VIOLATION, ["slug"]))).toContain("slug");
    expect(prismaErrorTarget(prismaLikeError(UNIQUE_VIOLATION, ["name"]))).toContain("name");
  });

  it("returns an empty string when there is no target to read", () => {
    expect(prismaErrorTarget(prismaLikeError(UNIQUE_VIOLATION))).toBe("");
    expect(prismaErrorTarget(new Error("boom"))).toBe("");
    expect(prismaErrorTarget(null)).toBe("");
  });
});
