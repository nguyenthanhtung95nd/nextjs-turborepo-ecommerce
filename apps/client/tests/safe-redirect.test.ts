import { describe, expect, it } from "vitest";
import { DEFAULT_AFTER_SIGN_IN, safeRedirect } from "@/lib/auth/safe-redirect";

describe("safeRedirect", () => {
  it("allows a path on this site", () => {
    expect(safeRedirect("/account")).toBe("/account");
  });

  it("keeps the query string and fragment", () => {
    expect(safeRedirect("/products?category=audio#grid")).toBe("/products?category=audio#grid");
  });

  it.each([[null], [undefined], [""]])("falls back when the target is %p", (target) => {
    expect(safeRedirect(target)).toBe(DEFAULT_AFTER_SIGN_IN);
  });

  /**
   * The attack this exists for: anyone can mail a shopper `/login?next=https://evil.example`, and
   * honouring it hands over someone who has just typed their password and has every reason to
   * trust wherever they land.
   */
  describe("refuses to leave this site", () => {
    it.each([
      ["an absolute https URL", "https://evil.example/phish"],
      ["an absolute http URL", "http://evil.example"],
      ["a protocol-relative URL", "//evil.example"],
      ["a backslash protocol-relative URL", "/\\evil.example"],
      ["a javascript: URL", "javascript:alert(1)"],
      ["a data: URL", "data:text/html,<script>alert(1)</script>"],
      ["a bare path with no leading slash", "evil.example"],
    ])("rejects %s", (_label, target) => {
      expect(safeRedirect(target)).toBe(DEFAULT_AFTER_SIGN_IN);
    });

    /**
     * Browsers strip tab, newline and carriage return from a URL before parsing it, so
     * `/\tjavascript:…` is a real way past a check that only looks at the first character.
     */
    it.each([
      ["a tab", "/\tjavascript:alert(1)"],
      ["a newline", "/\njavascript:alert(1)"],
      ["a carriage return", "/\rhttps://evil.example"],
      ["a null byte", "/\u0000//evil.example"],
    ])("rejects a target containing %s", (_label, target) => {
      expect(safeRedirect(target)).toBe(DEFAULT_AFTER_SIGN_IN);
    });
  });

  /** Landing back on the sign-in page after signing in reads as a failure even though it worked. */
  it.each([["/login"], ["/register"], ["/login?next=%2Flogin"]])(
    "does not bounce back to %s",
    (target) => {
      expect(safeRedirect(target)).toBe(DEFAULT_AFTER_SIGN_IN);
    },
  );

  // `/loginsomething` is a legitimate path that merely starts with the same letters.
  it("does not mistake a path that merely starts with /login", () => {
    expect(safeRedirect("/login-help")).toBe("/login-help");
  });
});
