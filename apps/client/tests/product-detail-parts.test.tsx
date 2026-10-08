import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Breadcrumb } from "@/components/product-detail/breadcrumb";
import { ProductFacts } from "@/components/product-detail/product-facts";
import { ProductPrice } from "@/components/product-detail/product-price";
import { StockBadge } from "@/components/product-detail/stock-badge";
import type { ProductDetail } from "@/lib/catalog/queries";

const PRODUCT: ProductDetail = {
  id: "1",
  name: "Mechanical Keyboard K70",
  slug: "mechanical-keyboard-k70",
  description: "Cherry MX Red switches.",
  priceCents: 15900,
  compareAtPriceCents: 18900,
  stock: 42,
  category: { id: "1", name: "Peripherals", slug: "peripherals" },
  brand: { id: "2", name: "Corsair", slug: "corsair" },
  images: [],
};

describe("ProductPrice", () => {
  it("formats the price as currency rather than raw cents", () => {
    render(<ProductPrice priceCents={15900} compareAtPriceCents={null} />);
    expect(screen.getByText("$159.00")).toBeInTheDocument();
    expect(screen.queryByText("15900")).not.toBeInTheDocument();
  });

  it("strikes through the old price and spells out the saving", () => {
    render(<ProductPrice priceCents={15900} compareAtPriceCents={18900} />);
    expect(screen.getByText("$189.00").tagName).toBe("S");
    expect(screen.getByText("Save $30.00 (16%)")).toBeInTheDocument();
  });

  it("claims no saving when the compare-at price is not higher", () => {
    render(<ProductPrice priceCents={15900} compareAtPriceCents={15900} />);
    expect(screen.queryByText(/save/i)).not.toBeInTheDocument();
  });
});

describe("StockBadge", () => {
  it.each([
    [42, "In stock"],
    [3, "Only 3 left"],
    [1, "Only 1 left"],
    [0, "Out of stock"],
  ])("describes %i units as %s", (stock, expected) => {
    render(<StockBadge stock={stock} />);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});

describe("ProductFacts", () => {
  /** Both show the same products, but a landing page has a name, a heading and a canonical URL. */
  it("links the brand and the category to their landing pages", () => {
    render(<ProductFacts product={PRODUCT} />);
    expect(screen.getByRole("link", { name: "Corsair" })).toHaveAttribute(
      "href",
      "/brands/corsair",
    );
    expect(screen.getByRole("link", { name: "Peripherals" })).toHaveAttribute(
      "href",
      "/categories/peripherals",
    );
  });

  /** An empty row tells a shopper nothing except that the page expected something. */
  it("leaves out a fact the product does not have", () => {
    render(<ProductFacts product={{ ...PRODUCT, brand: null }} />);
    expect(screen.queryByText("Brand")).not.toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("pairs each term with its value", () => {
    render(<ProductFacts product={PRODUCT} />);
    expect(screen.getByText("Product code")).toBeInTheDocument();
    expect(screen.getByText("mechanical-keyboard-k70")).toBeInTheDocument();
  });
});

describe("Breadcrumb", () => {
  it("links every crumb but the current page", () => {
    render(
      <Breadcrumb
        trail={[
          { label: "Shop", href: "/products" },
          { label: "Peripherals", href: "/products?category=peripherals" },
        ]}
        current="Mechanical Keyboard K70"
      />,
    );

    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByText("Mechanical Keyboard K70").closest("a")).toBeNull();
  });

  it("marks where the shopper is", () => {
    render(<Breadcrumb trail={[{ label: "Shop", href: "/products" }]} current="K70" />);
    expect(screen.getByText("K70")).toHaveAttribute("aria-current", "page");
  });

  it("is a navigation landmark with a name", () => {
    render(<Breadcrumb trail={[{ label: "Shop", href: "/products" }]} current="K70" />);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
  });
});
