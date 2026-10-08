import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActiveFilters } from "@/components/catalog/active-filters";
import type { CatalogListParams } from "@repo/contracts";
import { categoryRoute, productsRoute, searchRoute } from "@/lib/catalog/url";

const CATEGORIES = [{ id: "1", name: "Displays", slug: "displays" }];
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

function renderChips(overrides: Partial<CatalogListParams> = {}, route = productsRoute) {
  render(
    <ActiveFilters
      route={route}
      params={{ ...BASE, ...overrides }}
      categories={CATEGORIES}
      brands={BRANDS}
    />,
  );
}

describe("ActiveFilters", () => {
  it("renders nothing when no filter is active", () => {
    const { container } = render(
      <ActiveFilters route={productsRoute} params={BASE} categories={CATEGORIES} brands={BRANDS} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  /** The heading says what was searched for; a chip would say it again, removably. */
  it("shows no chip for the search term", () => {
    const { container } = render(
      <ActiveFilters
        route={searchRoute}
        params={{ ...BASE, q: "keyboard" }}
        categories={CATEGORIES}
        brands={BRANDS}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  /**
   * On `/categories/displays` a removable "Displays" chip would promise something it cannot
   * deliver: there is no version of that page without it.
   */
  it("shows no chip for a filter the path implies", () => {
    renderChips({ category: "displays" }, categoryRoute("displays"));
    expect(screen.queryByText("Displays")).not.toBeInTheDocument();
  });

  it("still chips the other filters on a landing page", () => {
    renderChips({ category: "displays", brand: "dell" }, categoryRoute("displays"));
    expect(screen.getByText("Dell")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Remove the Dell brand filter" })).toHaveAttribute(
      "href",
      "/categories/displays",
    );
  });

  /** `?category=displays` is a URL; "Displays" is what the shopper actually chose. */
  it("names the category rather than echoing its slug", () => {
    renderChips({ category: "displays" });
    expect(screen.getByText("Displays")).toBeInTheDocument();
    expect(screen.queryByText("displays")).not.toBeInTheDocument();
  });

  it("falls back to the slug when it matches no known category", () => {
    renderChips({ category: "ghost-category" });
    expect(screen.getByText("ghost-category")).toBeInTheDocument();
  });

  it("formats price bounds as money, not as raw numbers", () => {
    renderChips({ priceMin: 50, priceMax: 900 });
    expect(screen.getByText("From $50.00")).toBeInTheDocument();
    expect(screen.getByText("Up to $900.00")).toBeInTheDocument();
  });

  it("gives each remove control a label naming what it removes", () => {
    renderChips({ category: "displays", brand: "dell" });
    expect(
      screen.getByRole("link", { name: "Remove the Displays category filter" }),
    ).toHaveAttribute("href", "/products?brand=dell");
    expect(screen.getByRole("link", { name: "Remove the Dell brand filter" })).toHaveAttribute(
      "href",
      "/products?category=displays",
    );
  });

  it("clears everything but the sort", () => {
    renderChips({ category: "displays", inStock: "1", sort: "price-desc" });
    expect(screen.getByRole("link", { name: "Clear all" })).toHaveAttribute(
      "href",
      "/products?sort=price-desc",
    );
  });

  it("shows one chip per active filter", () => {
    renderChips({ category: "displays", brand: "dell", priceMin: 50, inStock: "1" });
    // Four removal links plus "Clear all".
    expect(screen.getAllByRole("link")).toHaveLength(5);
  });
});
