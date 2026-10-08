import { describe, expect, it } from "vitest";
import { buildListHref } from "@repo/ui/list-href";
import type { UserListParams } from "@repo/contracts";
import { hasActiveFilters, usersHref } from "@/features/users/url";

const USER_DEFAULTS: UserListParams = { q: "", role: "", status: "ALL", page: 1 };

describe("buildListHref", () => {
  it("omits every default, so an unfiltered list is a bare path", () => {
    expect(buildListHref("/things", { a: "", b: 1 }, { a: "", b: 1 })).toBe("/things");
  });

  it("keeps the declaration order of the params, so the same filters give the same URL", () => {
    const defaults = { q: "", status: "ALL", sort: "newest", page: 1 };
    const params = { q: "key", status: "DRAFT", sort: "newest", page: 3 };
    expect(buildListHref("/things", defaults, params)).toBe("/things?q=key&status=DRAFT&page=3");
  });

  it("encodes values that are not URL-safe", () => {
    expect(buildListHref("/things", { q: "" }, { q: "" }, { q: "a & b" })).toBe(
      "/things?q=a+%26+b",
    );
  });

  it("drops a parameter when an override returns it to its default", () => {
    const params = { q: "key", status: "DRAFT", page: 4 };
    const defaults = { q: "", status: "ALL", page: 1 };
    expect(buildListHref("/things", defaults, params, { status: "ALL", page: 1 })).toBe(
      "/things?q=key",
    );
  });
});

describe("usersHref", () => {
  it("builds a shareable URL from the active filters", () => {
    expect(usersHref({ ...USER_DEFAULTS, q: "minh", status: "ACTIVE" }, { page: 2 })).toBe(
      "/users?q=minh&status=ACTIVE&page=2",
    );
  });

  it("returns the bare route once every filter is cleared", () => {
    const params: UserListParams = { q: "minh", role: "SUPER_ADMIN", status: "ACTIVE", page: 3 };
    expect(usersHref(params, { q: "", role: "", status: "ALL", page: 1 })).toBe("/users");
  });
});

describe("hasActiveFilters", () => {
  it("ignores the page number, which narrows nothing", () => {
    expect(hasActiveFilters({ ...USER_DEFAULTS, page: 5 })).toBe(false);
  });

  it.each([{ q: "minh" }, { role: "SUPER_ADMIN" }, { status: "INACTIVE" as const }])(
    "detects %o",
    (override) => {
      expect(hasActiveFilters({ ...USER_DEFAULTS, ...override })).toBe(true);
    },
  );
});
