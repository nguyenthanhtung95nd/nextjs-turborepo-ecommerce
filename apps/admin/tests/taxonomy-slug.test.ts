import { describe, expect, it } from "vitest";
import { slugify } from "@/features/taxonomy/slug";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe("slugify", () => {
  it.each([
    ["Peripherals", "peripherals"],
    ["Gaming Mice", "gaming-mice"],
    ["4K Monitors", "4k-monitors"],
    ["USB-C Hubs", "usb-c-hubs"],
  ])("turns %s into %s", (name, expected) => {
    expect(slugify(name)).toBe(expected);
  });

  it("strips diacritics instead of dropping the letters", () => {
    expect(slugify("Café Équipement")).toBe("cafe-equipement");
  });

  // đ decomposes to nothing under NFD, so it needs its own mapping — without it the letter
  // would vanish and "Bàn phím đẹp" would slug to "ban-phim-ep".
  it("maps Vietnamese đ to d", () => {
    expect(slugify("Bàn phím Gaming")).toBe("ban-phim-gaming");
    expect(slugify("Đồ điện tử")).toBe("do-dien-tu");
  });

  it.each([
    ["  Spaced  Out  ", "spaced-out"],
    ["Slashes/And&Symbols", "slashes-and-symbols"],
    ["Multiple   Spaces", "multiple-spaces"],
    ["--Leading and trailing--", "leading-and-trailing"],
  ])("collapses punctuation and whitespace in %s", (name, expected) => {
    expect(slugify(name)).toBe(expected);
  });

  it("returns an empty string when nothing slug-able is left", () => {
    expect(slugify("???")).toBe("");
    expect(slugify("   ")).toBe("");
  });

  it.each(["Peripherals", "Bàn phím Gaming", "4K Monitors", "Slashes/And&Symbols"])(
    "produces output the database CHECK constraint accepts for %s",
    (name) => {
      expect(SLUG_PATTERN.test(slugify(name))).toBe(true);
    },
  );
});
