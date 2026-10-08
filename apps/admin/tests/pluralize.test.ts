import { describe, expect, it } from "vitest";
import { pluralize } from "@repo/ui/format";

describe("pluralize", () => {
  it("uses the singular for exactly one", () => {
    expect(pluralize(1, "user", "users")).toBe("1 user");
  });

  it.each([0, 2, 11, 100])("uses the plural for %i", (count) => {
    expect(pluralize(count, "user", "users")).toBe(`${count} users`);
  });

  // The reason both forms are arguments: deriving them put "No categorys yet" on screen.
  it("takes the irregular plural from the caller rather than deriving it", () => {
    expect(pluralize(3, "category", "categories")).toBe("3 categories");
    expect(pluralize(1, "category", "categories")).toBe("1 category");
  });
});
