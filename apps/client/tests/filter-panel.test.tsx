import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FilterPanel } from "@/components/catalog/filter-panel";
import type { CatalogListParams } from "@repo/contracts";
import { brandRoute, categoryRoute, productsRoute } from "@/lib/catalog/url";

const CATEGORIES = [
  { id: "1", name: "Displays", slug: "displays" },
  { id: "2", name: "Audio", slug: "audio" },
];
const BRANDS = [{ id: "3", name: "Dell", slug: "dell" }];

const BASE: CatalogListParams = {
  q: "",
  category: "",
  brand: "",
  priceMin: 0,
  priceMax: 0,
  inStock: "0",
  sort: "newest",
  page: 1,
};

function renderPanel(overrides: Partial<CatalogListParams> = {}, route = productsRoute) {
  render(
    <FilterPanel
      route={route}
      params={{ ...BASE, ...overrides }}
      categories={CATEGORIES}
      brands={BRANDS}
    />,
  );
}

describe("FilterPanel", () => {
  it("offers every category and brand as a link", () => {
    renderPanel();
    expect(screen.getByRole("link", { name: "Displays" })).toHaveAttribute(
      "href",
      "/products?category=displays",
    );
    expect(screen.getByRole("link", { name: "Dell" })).toHaveAttribute(
      "href",
      "/products?brand=dell",
    );
  });

  /** The on/off state has to reach a screen reader, not only the tick icon. */
  it("marks the chosen option as pressed", () => {
    renderPanel({ category: "displays" });
    expect(screen.getByRole("link", { name: "Displays" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("link", { name: "Audio" })).toHaveAttribute("aria-pressed", "false");
  });

  it("turns the chosen option into its own undo", () => {
    renderPanel({ category: "displays" });
    expect(screen.getByRole("link", { name: "Displays" })).toHaveAttribute("href", "/products");
  });

  it("returns to page 1 when a filter changes", () => {
    renderPanel({ page: 4 });
    expect(screen.getByRole("link", { name: "Audio" })).toHaveAttribute(
      "href",
      "/products?category=audio",
    );
  });

  it("keeps the other filters when one option is chosen", () => {
    renderPanel({ brand: "dell", inStock: "1" });
    expect(screen.getByRole("link", { name: "Displays" })).toHaveAttribute(
      "href",
      "/products?category=displays&brand=dell&inStock=1",
    );
  });

  it("toggles the in-stock filter rather than only switching it on", () => {
    renderPanel({ inStock: "1" });
    expect(screen.getByRole("link", { name: "In stock only" })).toHaveAttribute(
      "href",
      "/products",
    );
  });

  it("offers no way to clear filters when none are set", () => {
    renderPanel();
    expect(screen.queryByRole("link", { name: /clear all/i })).not.toBeInTheDocument();
  });

  it("offers a clear-all link once a filter is set", () => {
    renderPanel({ category: "audio" });
    expect(screen.getByRole("link", { name: /clear all filters/i })).toHaveAttribute(
      "href",
      "/products",
    );
  });

  describe("price form", () => {
    it("submits to the listing as a plain GET form, so it works without JavaScript", () => {
      renderPanel();
      const form = screen.getByRole("button", { name: /apply price/i }).closest("form");
      expect(form).toHaveAttribute("action", "/products");
      expect(form).not.toHaveAttribute("method", "post");
    });

    it("shows an unset bound as an empty field, not as a literal zero", () => {
      renderPanel();
      expect(screen.getByLabelText("Minimum price")).toHaveValue(null);
    });

    it("shows the bounds that are in the URL", () => {
      renderPanel({ priceMin: 50, priceMax: 900 });
      expect(screen.getByLabelText("Minimum price")).toHaveValue(50);
      expect(screen.getByLabelText("Maximum price")).toHaveValue(900);
    });

    /**
     * A GET form replaces the whole query string, so anything not in the form is lost unless it
     * is resubmitted. Losing the category on an "apply price" click is the bug this guards.
     */
    it("carries the other filters through as hidden fields", () => {
      renderPanel({ category: "audio", sort: "price-asc" });
      const form = screen.getByRole("button", { name: /apply price/i }).closest("form");
      expect(form?.querySelector('input[name="category"]')).toHaveValue("audio");
      expect(form?.querySelector('input[name="sort"]')).toHaveValue("price-asc");
    });

    it("does not resubmit filters that are at their default", () => {
      renderPanel({ category: "audio" });
      const form = screen.getByRole("button", { name: /apply price/i }).closest("form");
      expect(form?.querySelector('input[name="brand"]')).toBeNull();
      expect(form?.querySelector('input[name="sort"]')).toBeNull();
    });

    it("does not carry the page, because a new range invalidates it", () => {
      renderPanel({ page: 5 });
      const form = screen.getByRole("button", { name: /apply price/i }).closest("form");
      expect(form?.querySelector('input[name="page"]')).toBeNull();
    });

    it("posts back to the route it is on, not always to /products", () => {
      renderPanel({ category: "displays" }, categoryRoute("displays"));
      const form = screen.getByRole("button", { name: /apply price/i }).closest("form");
      expect(form).toHaveAttribute("action", "/categories/displays");
    });

    /** The path already says the category; a hidden field would repeat it into the query string. */
    it("does not resubmit a filter the path implies", () => {
      renderPanel({ category: "displays" }, categoryRoute("displays"));
      const form = screen.getByRole("button", { name: /apply price/i }).closest("form");
      expect(form?.querySelector('input[name="category"]')).toBeNull();
    });
  });

  describe("on a landing page", () => {
    /**
     * The category is the page. Offering it as a checkbox invites a shopper to uncheck the thing
     * they are looking at; the header nav is how you move between categories.
     */
    it("drops the Category group on a category page", () => {
      renderPanel({ category: "displays" }, categoryRoute("displays"));
      expect(screen.queryByRole("region", { name: "Category" })).not.toBeInTheDocument();
      expect(screen.getByRole("region", { name: "Brand" })).toBeInTheDocument();
    });

    it("drops the Brand group on a brand page", () => {
      renderPanel({ brand: "dell" }, brandRoute("dell"));
      expect(screen.queryByRole("region", { name: "Brand" })).not.toBeInTheDocument();
      expect(screen.getByRole("region", { name: "Category" })).toBeInTheDocument();
    });

    it("keeps the remaining filters on the landing path", () => {
      renderPanel({ category: "displays" }, categoryRoute("displays"));
      expect(screen.getByRole("link", { name: "In stock only" })).toHaveAttribute(
        "href",
        "/categories/displays?inStock=1",
      );
    });

    it("offers no clear-all before anything is actually filtered", () => {
      renderPanel({ category: "displays" }, categoryRoute("displays"));
      expect(screen.queryByRole("link", { name: /clear all/i })).not.toBeInTheDocument();
    });

    it("offers clear-all once a real filter is added, and stays on the page", () => {
      renderPanel({ category: "displays", inStock: "1" }, categoryRoute("displays"));
      expect(screen.getByRole("link", { name: /clear all filters/i })).toHaveAttribute(
        "href",
        "/categories/displays",
      );
    });
  });
});
