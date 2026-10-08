import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "@/components/product-card";
import type { CatalogProduct } from "@/lib/catalog/queries";

// next/image needs a Next runtime it will not get here; a plain <img> keeps the alt text and
// the src, which is all these assertions are about.
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- the stub stands in for next/image; the rule is about shipped markup
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const PRODUCT: CatalogProduct = {
  id: "1",
  name: "Mechanical Keyboard K70",
  slug: "mechanical-keyboard-k70",
  priceCents: 15900,
  compareAtPriceCents: null,
  inStock: true,
  categoryName: "Peripherals",
  brandName: "Corsair",
  imageUrl: "https://cdn.example.com/k70.jpg",
  imageAlt: "A mechanical keyboard",
  stock: 42,
  status: "PUBLISHED",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function renderCard(overrides: Partial<CatalogProduct> = {}) {
  render(<ProductCard product={{ ...PRODUCT, ...overrides }} />);
}

describe("ProductCard", () => {
  it("links to the product by slug, not by id", () => {
    renderCard();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/products/mechanical-keyboard-k70");
  });

  it("formats the price as currency rather than raw cents", () => {
    renderCard();
    expect(screen.getByText("$159.00")).toBeInTheDocument();
    expect(screen.queryByText("15900")).not.toBeInTheDocument();
  });

  it("shows the old price struck through when there is a markdown", () => {
    renderCard({ compareAtPriceCents: 18900 });
    expect(screen.getByText("$189.00").tagName).toBe("S");
    expect(screen.getByText("Sale")).toBeInTheDocument();
  });

  // The database CHECK already forbids it, but a card must not invent a discount if it slips in.
  it("claims no sale when the compare-at price is not higher", () => {
    renderCard({ compareAtPriceCents: 15900 });
    expect(screen.queryByText("Sale")).not.toBeInTheDocument();
  });

  it("shows no sale badge when there is no compare-at price", () => {
    renderCard();
    expect(screen.queryByText("Sale")).not.toBeInTheDocument();
  });

  /**
   * The price is replaced, not joined: showing what something costs while it cannot be bought
   * invites a click that ends in disappointment.
   */
  it("replaces the price with the stock state when out of stock", () => {
    renderCard({ inStock: false });
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(screen.queryByText("$159.00")).not.toBeInTheDocument();
  });

  it("describes the image, because it is how one card is told from another", () => {
    renderCard();
    expect(screen.getByRole("img")).toHaveAccessibleName("A mechanical keyboard");
  });

  it("renders a placeholder, not a broken image, when there is no photo", () => {
    renderCard({ imageUrl: null });
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("link")).toBeInTheDocument();
  });

  it("joins brand and category with a separator", () => {
    renderCard();
    expect(screen.getByText("Corsair · Peripherals")).toBeInTheDocument();
  });

  it.each([
    [{ brandName: null }, "Peripherals"],
    [{ categoryName: null }, "Corsair"],
  ])("omits the missing half of the meta line (%o)", (overrides, expected) => {
    renderCard(overrides);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("drops the meta line entirely when a product has neither", () => {
    renderCard({ brandName: null, categoryName: null });
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });
});
